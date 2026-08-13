/**
 * Placeholder retrieval layer — returns no context until KnowledgeSource documents
 * exist and a real similarity search (e.g. MongoDB Atlas Vector Search) is wired up
 * here. Keeping this as its own module means swapping in real RAG later doesn't
 * touch aiController at all.
 */
async function retrieveContext(question) {
  // TODO: embed `question`, run a vector/text search over KnowledgeSource, and return
  // the best-matching chunks plus their _ids for citation.
  return { context: "", sourceIds: [] };
}

module.exports = { retrieveContext };
