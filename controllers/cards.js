const Card = require('../models/card');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

module.exports.addCard = (req, res, next) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((card) => {
      Card.findById(card._id)
        .orFail(new Error('NotFound'))
        .populate('owner')
        .then((data) => res.status(201).send(data))
        .catch((err) => {
          if (err.message === 'NotFound') {
            next(new NotFoundError('Карточка с указанным id не найдена'));
          } else {
            next(err);
          }
        });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

module.exports.getCards = (req, res, next) => {
  Card.find({})
    .populate(['owner', 'likes'])
    .then((cards) => res.send(cards))
    .catch((err) => next(err));
};

module.exports.deleteCards = (req, res, next) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (!card.owner.equals(req.user._id)) {
        throw new ForbiddenError('Карточка другого пользователя');
      }
      Card.deleteOne(card)
        .orFail(new Error('NotFound'))
        .then(() => {
          res.status(200).send({ message: 'Карточка удалена' });
        })
        .catch((err) => {
          if (err.message === 'NotFound') {
            next(new NotFoundError('Карточка с указанным id не найдена'));
          } else if (err.name === 'CastError') {
            next(new BadRequestError('Некорректный Id'));
          } else {
            next(err);
          }
        });
    })
    .catch((err) => {
      if (err.name === 'TypeError') {
        next(new NotFoundError('Карточка с указанным id не найдена'));
      } else {
        next(err);
      }
    });
};

module.exports.likeCards = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $addToSet: { likes: req.user._id } }, { new: true })
    .populate(['owner', 'likes'])
    .orFail(new Error('NotFound'))
    .then((card) => {
      res.status(200).send(card);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        next(new NotFoundError('Карточка с указанным id не найдена'));
      } else if (err.name === 'CastError') {
        next(new BadRequestError('Некорректный Id'));
      } else {
        next(err);
      }
    });
};

module.exports.dislikeCards = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $pull: { likes: req.user._id } }, { new: true })
    .populate(['owner', 'likes'])
    .orFail(new Error('NotFound'))
    .then((card) => {
      res.status(200).send(card);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        next(new NotFoundError('Карточка с указанным id не найдена'));
      } else if (err.name === 'CastError') {
        next(new BadRequestError('Некорректный Id'));
      } else {
        next(err);
      }
    });
};
