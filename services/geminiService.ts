
import { GoogleGenAI, Type } from "@google/genai";
import { GroceryItem, OptimizationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extrai itens de uma fatura em PDF e normaliza para busca global
 */
export async function parseReceiptPdf(base64Pdf: string): Promise<string[]> {
  const prompt = `
    ESTÁS A ATUAR COMO UM AUDITOR DE FATURAS DE RETALHO (PORTUGAL).
    
    TAREFA:
    1. Analisa o PDF da fatura fornecido.
    2. Extrai os produtos comprados, mas segue estas regras de NORMALIZAÇÃO para comparação entre lojas:
       - REMOVE NOMES DE SUPERMERCADOS: Se o produto for marca própria (ex: "Arroz Agulha Continente", "Leite Pingo Doce", "Azeite Auchan"), extrai apenas o tipo e quantidade (ex: "Arroz Agulha 1kg").
       - PRESERVA MARCAS COMERCIAIS: Se for uma marca independente (ex: "Leite Mimosa", "Azeite Gallo", "Coca-Cola", "Compal", "Ruffles"), MANTÉM o nome da marca.
       - QUANTIDADE É VITAL: Garante que a quantidade (1kg, 500g, 1L) é incluída no nome do item.
    
    OBJECTIVO: Criar uma lista que possa ser pesquisada em QUALQUER supermercado, não apenas no que emitiu a fatura.
    
    RETORNA APENAS UM ARRAY JSON DE STRINGS:
    ["Produto 1", "Produto 2", ...]
  `;

  try {
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

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Não foi possível ler a fatura. Certifique-se de que o PDF é legível.");
  }
}

/**
 * Otimiza a lista de compras cruzando com Google Shopping em múltiplos mercados
 */
export async function optimizeShoppingList(
  items: GroceryItem[],
  latitude: number,
  longitude: number
): Promise<OptimizationResult> {
  const itemListString = items.map(i => i.name).join(", ");
  
  const prompt = `
    ESTÁS A ATUAR COMO UM COMPARADOR DE PREÇOS MULTI-LOJA (GOOGLE SHOPPING PORTUGAL).
    
    LOCALIZAÇÃO: Latitude ${latitude}, Longitude ${longitude}.
    
    MISSÃO:
    1. Para cada item: "${itemListString}", realiza uma busca global no Google Shopping.
    2. DEVES COMPARAR O MESMO ITEM EM PELO MENOS 3 SUPERMERCADOS DIFERENTES (ex: Continente, Pingo Doce, Auchan, Lidl).
    3. Se o item for genérico (ex: "Arroz Agulha 1kg"), encontra a opção de Marca Própria de CADA loja.
    4. Se o item tiver marca específica (ex: "Leite Mimosa"), encontra o preço desse item exato em todas as lojas.
    
    DIRETRIZES DE PREÇO:
    - Extrai preços reais de snippets de pesquisa ou Google Shopping.
    - Prioriza a verdade do preço atual sobre qualquer dado histórico.

    RETORNA APENAS JSON:
    {
      "markets": [
        {
          "id": "slug-da-loja",
          "name": "Nome da Loja Física Próxima",
          "address": "Morada",
          "lat": 38.XXXX, "lng": -9.XXXX,
          "officialUrl": "URL",
          "flyerUrl": "URL",
          "products": {
            "ItemOriginal": { 
              "name": "Nome do SKU encontrado nessa loja", 
              "price": 0.00, 
              "unit": "un", 
              "category": "Cat", 
              "isCheapest": true,
              "isPrivateLabel": true 
            }
          }
        }
      ],
      "summary": {
        "totalOriginalEstimate": 0.00,
        "totalOptimizedCost": 0.00,
        "savings": 0.00,
        "currencySymbol": "€"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("A auditoria multi-loja falhou.");

    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("Gemini Auditor Error:", error);
    throw new Error("Erro na comparação multi-loja. Tente novamente.");
  }
}
