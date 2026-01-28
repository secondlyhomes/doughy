// Supabase Edge Function to process uploaded documents
import { serve } from "http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { decryptServer } from "../_shared/crypto-server.ts";

const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002";
const EMBEDDING_DIMENSIONS = 1536;

// Maximum batch size for embedding requests
const MAX_BATCH_SIZE = 20;

interface DocumentChunk {
  documentId: string;
  text: string;
  chunkIndex: number;
}

serve(async (req: Request) => {
  // IMPORTANT: CORS preflight handling must come first
  // Handle OPTIONS requests with the shared CORS handler
  const corsResponse = handleCors(req);
  if (corsResponse) {
    console.log("Handling CORS preflight request for process-document");
    return corsResponse;
  }
  
  // Get CORS headers for regular requests
  const origin = req.headers.get('origin');
  const hasCredentials = !!req.headers.get('authorization');
  const customCorsHeaders = getCorsHeaders(origin, hasCredentials);

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseSecretKey = Deno.env.get("SUPABASE_SECRET_KEY");

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("[process-document] Missing required environment variables:", {
        SUPABASE_URL: supabaseUrl ? "set" : "MISSING",
        SUPABASE_SECRET_KEY: supabaseSecretKey ? "set" : "MISSING",
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }),
        { status: 500, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseSecretKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized or invalid token" }),
        { status: 401, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch OpenAI API key from database
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from("security_api_keys")
      .select("key_ciphertext")
      .or('service.eq.openai,service.eq.openai-key')
      .single();
    
    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: "Failed to retrieve OpenAI API key", details: apiKeyError?.message }),
        { status: 500, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Decrypt the API key
    let openaiApiKey;
    try {
      openaiApiKey = await decryptServer(apiKeyData.key_ciphertext);
    } catch (decryptError) {
      console.error('Error decrypting OpenAI API key:', decryptError);
      return new Response(
        JSON.stringify({ error: "Failed to decrypt OpenAI API key", details: decryptError instanceof Error ? decryptError.message : "Unknown error" }),
        { status: 500, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { documentId } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Missing documentId parameter" }),
        { status: 400, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch document info
    const { data: document, error: docError } = await supabaseClient
      .from("re_property_documents")
      .select("*")
      .eq("id", documentId)
      .single();
    
    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found", details: docError?.message }),
        { status: 404, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if the file is a URL
    if (document.file_type === "url") {
      // For URLs, we would fetch and parse here
      // This is a simplified version that just uses the URL itself
      await processTextContent(supabaseClient, documentId, `URL document: ${document.file_path}`, openaiApiKey);
    } else {
      // Get file content from storage
      const { data: fileData, error: fileError } = await supabaseClient
        .storage
        .from("re-property-documents")
        .download(document.file_path);
      
      if (fileError || !fileData) {
        return new Response(
          JSON.stringify({ error: "Failed to download document file", details: fileError?.message }),
          { status: 500, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Extract text based on file type
      const text = await extractTextFromFile(fileData, document.file_type);
      
      // Process the extracted text
      await processTextContent(supabaseClient, documentId, text, openaiApiKey);
    }
    
    // Update document processing status
    await supabaseClient
      .from("re_document_processing_queue")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("document_id", documentId);
    
    return new Response(
      JSON.stringify({ success: true, documentId, message: "Document processed successfully" }),
      { status: 200, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    
    // If we have a document ID, update its status
    try {
      if (req.body) {
        const { documentId } = await req.json();
        if (documentId) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseSecretKey = Deno.env.get("SUPABASE_SECRET_KEY");

          if (supabaseUrl && supabaseSecretKey) {
            const supabaseClient = createClient(supabaseUrl, supabaseSecretKey);

            await supabaseClient
              .from("re_document_processing_queue")
              .update({
                status: "failed",
                error_message: error instanceof Error ? error.message : "Unknown error",
                processed_at: new Date().toISOString()
              })
              .eq("document_id", documentId);
          } else {
            console.error("[process-document] Cannot update document status: Missing Supabase credentials");
          }
        }
      }
    } catch (updateError) {
      console.error("[process-document] Failed to update document status after error:", {
        updateError: updateError instanceof Error ? updateError.message : updateError,
        originalError: error instanceof Error ? error.message : error,
      });
    }
    
    return new Response(
      JSON.stringify({ error: "Failed to process document", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...customCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Extract text from file based on file type
 */
async function extractTextFromFile(file: Blob, fileType: string): Promise<string> {
  // In a production environment, you would implement proper file type parsing here
  // This is a simplified version that just returns the file content as text
  const text = await file.text();
  return text;
}

/**
 * Process text content, chunk it, and generate embeddings
 */
async function processTextContent(
  supabaseClient: any,
  documentId: string,
  text: string,
  openaiApiKey: string
): Promise<void> {
  // Normalize text
  const normalizedText = normalizeText(text);
  
  // Chunk the text
  const chunks = chunkText(normalizedText, 1000, 200, documentId);
  
  // Generate embeddings for chunks
  await generateEmbeddings(supabaseClient, documentId, chunks, openaiApiKey);
}

/**
 * Normalize text by removing excess whitespace
 */
function normalizeText(text: string): string {
  if (!text) return "";
  
  // Replace multiple newlines with a single newline
  let normalized = text.replace(/\n{3,}/g, "\n\n");
  
  // Replace multiple spaces with a single space
  normalized = normalized.replace(/[ \t]+/g, " ");
  
  // Trim whitespace
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text: string, chunkSize: number, overlap: number, documentId: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  if (!text || text.length === 0) {
    return chunks;
  }
  
  // Split by paragraphs
  const paragraphs = text.split(/\n{2,}/);
  
  let currentChunk = "";
  let chunkIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    // If adding this paragraph would exceed the chunk size
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      // Save the current chunk
      chunks.push({
        documentId,
        text: currentChunk,
        chunkIndex
      });
      
      chunkIndex++;
      
      // Start a new chunk with overlap
      if (overlap > 0 && currentChunk.length > overlap) {
        currentChunk = currentChunk.substring(currentChunk.length - overlap);
      } else {
        currentChunk = "";
      }
    }
    
    // Add paragraph to the current chunk
    if (currentChunk.length > 0) {
      currentChunk += "\n\n" + paragraph;
    } else {
      currentChunk = paragraph;
    }
  }
  
  // Add the final chunk if there's anything left
  if (currentChunk.length > 0) {
    chunks.push({
      documentId,
      text: currentChunk,
      chunkIndex
    });
  }
  
  return chunks;
}

/**
 * Generate embeddings for chunks and store them in the database
 * Using fetch directly instead of OpenAI client library
 */
async function generateEmbeddings(
  supabaseClient: any,
  documentId: string,
  chunks: DocumentChunk[],
  openaiApiKey: string
): Promise<void> {
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key");
  }
  
  // Process chunks in batches to avoid rate limits
  for (let i = 0; i < chunks.length; i += MAX_BATCH_SIZE) {
    const batch = chunks.slice(i, i + MAX_BATCH_SIZE);
    
    // Generate embeddings for each chunk in the batch
    const embeddingPromises = batch.map(async (chunk) => {
      try {
        // Skip empty chunks
        if (!chunk.text || chunk.text.trim().length === 0) {
          return null;
        }
        
        // Generate embedding using OpenAI API directly
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: OPENAI_EMBEDDING_MODEL,
            input: chunk.text.trim()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        const embedding = data.data[0].embedding;
        
        // Store embedding in the database
        const { error } = await supabaseClient
          .from("re_document_embeddings")
          .insert({
            document_id: documentId,
            content_chunk: chunk.text,
            embedding,
            chunk_index: chunk.chunkIndex
          });
        
        if (error) {
          console.error(`Error storing embedding for chunk ${chunk.chunkIndex}:`, error);
        }
        
        return { chunkIndex: chunk.chunkIndex, success: !error };
      } catch (error) {
        console.error(`Error generating embedding for chunk ${chunk.chunkIndex}:`, error);
        return { chunkIndex: chunk.chunkIndex, success: false };
      }
    });
    
    // Wait for all embeddings in the batch to be processed
    await Promise.all(embeddingPromises);
    
    // Throttle requests to avoid rate limits
    if (i + MAX_BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}