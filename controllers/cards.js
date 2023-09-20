const Card = require('../models/card');

module.exports.addCard = (req, res) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((card) => {
      Card.findById(card._id)
        .populate('owner')
        .then((data) => res.status(201).send(data))
        .catch(() => res
          .status(404)
          .send({ message: 'Карточка с указанным id не найдена' }));
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        res.status(400).send({ message: err.message });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};

module.exports.getCards = (req, res) => {
  Card.find({})
    .populate(['owner', 'likes'])
    .then((cards) => res.send(cards))
    .catch(() => res.status(500).send({ message: 'На сервере произошла ошибка' }));
};

module.exports.deleteCards = (req, res) => {
  Card.findByIdAndRemove(req.params.cardId)
    .orFail(new Error('NotFound'))
    .then(() => {
      res.status(200).send({ message: 'Карточка удалена' });
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(404).send({ message: 'Карточка с указанным id не найдена' });
      } else if (err.name === 'CastError') {
        res.status(400).send({ message: 'Некорректный Id' });
      } else {
        res.status(500).send({ message: 'Произошла ошибка при запросе пользователя' });
      }
    });
};

module.exports.likeCards = (req, res) => {
  if (req.params.cardId.length === 24) {
    Card.findByIdAndUpdate(req.params.cardId, { $addToSet: { likes: req.user._id } }, { new: true })
      .populate(['owner', 'likes'])
      .then((card) => {
        if (!card) {
          res.status(404).send({ message: 'Карточка с указанным id не найдена' });
          return;
        }
        res.send(card);
      })
      .catch(() => res.status(404).send({ message: 'Карточка с указанным id не найдена' }));
  } else {
    res.status(400).send({ message: 'Некорректный Id' });
  }
};

module.exports.dislikeCards = (req, res) => {
  if (req.params.cardId.length === 24) {
    Card.findByIdAndUpdate(req.params.cardId, { $pull: { likes: req.user._id } }, { new: true })
      .populate(['owner', 'likes'])
      .then((card) => {
        if (!card) {
          res.status(404).send({ message: 'Карточка с указанным id не найдена' });
          return;
        }
        res.send(card);
      })
      .catch(() => res.status(404).send({ message: 'Карточка с указанным id не найдена' }));
  } else {
    res.status(400).send({ message: 'Некорректный Id' });
  }
};
