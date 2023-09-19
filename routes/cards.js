const router = require('express').Router();
const {
  addCard, getCards, deleteCards, likeCards, dislikeCards,
} = require('../controllers/cards');

router.post('/', addCard);
router.get('/', getCards);
router.delete('/:cardId', deleteCards);
router.put('/:cardId/likes', likeCards);
router.delete('/:cardId/likes', dislikeCards);

module.exports = router;
