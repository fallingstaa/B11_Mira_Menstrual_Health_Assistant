const EducationalContent = require("../models/EducationalContent");
const { success, error } = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const listArticles = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};

  const articles = await EducationalContent.find(filter)
    .select("title category")
    .sort({ createdAt: -1 });

  return success(res, articles);
});

const getArticleById = asyncHandler(async (req, res) => {
  const article = await EducationalContent.findById(req.params.id);
  if (!article) return error(res, "Article not found", 404);
  return success(res, article);
});

module.exports = { listArticles, getArticleById };
