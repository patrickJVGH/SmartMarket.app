
import { GoogleGenAI, Type } from "@google/genai";
import { GroceryItem, Market } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utilitário para pausa/delay
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Wrapper para chamadas ao Gemini com Retry Exponencial
 */
async function callGeminiWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED");
      
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit atingido. Tentativa ${i + 1}/${maxRetries}. Esperando ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Sugere um nome e ícone para a lista com base nos itens
 */
export async function suggestListNameAndIcon(items: GroceryItem[]): Promise<{ name: string, icon: string }> {
  const itemList = items.map(i => i.name).join(", ");
  const prompt = `
    Analise estes itens de compras: "${itemList}".
    Sugira um NOME criativo e curto (max 3 palavras) para esta lista (ex: "Churrasco de Domingo", "Cabaz Semanal", "Limpeza de Casa").
    Escolha também um NOME DE ÍCONE da biblioteca Lucide-React que combine (ex: "Flame", "Apple", "Coffee", "Droplets", "ShoppingBasket", "Beef", "Baby", "Pizza").
    
    RETORNA APENAS JSON:
    { "name": "Sugestão de Nome", "icon": "NomeDoIcone" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"name": "Minha Lista", "icon": "ShoppingBasket"}');
  } catch {
    return { name: "Nova Lista", icon: "ShoppingBasket" };
  }
}

/**
 * Extrai itens de uma fatura em PDF e normaliza para busca global
 */
export async function parseReceiptPdf(base64Pdf: string): Promise<string[]> {
  const prompt = `
    ESTÁS A ATUAR COMO UM AUDITOR DE FATURAS DE RETALHO (PORTUGAL).
    
    TAREFA:
    1. Analisa o PDF da fatura fornecido.
    2. Extrai os produtos comprados, mas segue estas regras de NORMALIZAÇÃO:
       - REMOVE NOMES DE SUPERMERCADOS (ex: "Continente", "Pingo Doce").
       - PRESERVA MARCAS COMERCIAIS (ex: "Mimosa", "Gallo", "M&M's").
       - QUANTIDADE É VITAL (ex: "1kg", "500g").
    
    RETORNA APENAS UM ARRAY JSON DE STRINGS:
    ["Produto 1", "Produto 2", ...]
  `;

  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  });
}

/**
 * Busca preços de um único item com validação de stock e retry
 */
export async function fetchItemPrices(
  itemName: string,
  latitude: number,
  longitude: number
): Promise<Market[]> {
  const prompt = `
    ESTÁS A ATUAR COMO UM AGENTE DE AUDITORIA DE PREÇO ÚNICO (SKU).
    LOCALIZAÇÃO: Lat ${latitude}, Lng ${longitude}.
    ITEM: "${itemName}"

    TAREFA:
    1. Pesquisa o preço no Google Shopping para supermercados em Portugal.
    2. REGRA DE STOCK (OBRIGATÓRIO): Apenas inclui se estiver disponível/em stock.
    3. Retorna JSON com os dados das lojas e o produto encontrado.

    RETORNA APENAS JSON:
    [
      {
        "id": "slug-loja",
        "name": "Nome Loja",
        "address": "Morada",
        "lat": 38.X, "lng": -9.X,
        "officialUrl": "URL",
        "flyerUrl": "URL",
        "product": {
          "originalKey": "${itemName}",
          "name": "Nome SKU",
          "price": 0.00,
          "unit": "un",
          "category": "Cat",
          "isPrivateLabel": true
        }
      }
    ]
  `;

  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "[]";
    const firstBrace = text.indexOf('[');
    const lastBrace = text.lastIndexOf(']');
    if (firstBrace === -1) return [];
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  });
}
