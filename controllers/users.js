const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

module.exports.addUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, about, avatar, email, password: hash,
    })
      .then((user) => res.status(201).send({
        name: user.name, about: user.about, avatar: user.avatar, _id: user._id, email: user.email,
      }))
      .catch((err) => {
        if (err.code === 11000) {
          next(new ConflictError(`Пользователь с email: ${email} уже зарегистрирован`));
        } else if (err.name === 'ValidationError') {
          next(new BadRequestError(err.message));
        } else {
          next(err);
        }
      }));
};

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((user) => res.send(user))
    .catch((err) => {
      next(err);
    });
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail(new Error('NotFound'))
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        next(new NotFoundError('Пользователь с указанным id не найден'));
      } else if (err.name === 'CastError') {
        next(new BadRequestError('Некорректный Id'));
      } else {
        next(err);
      }
    });
};

module.exports.editUserData = (req, res, next) => {
  const { name, about } = req.body;
  if (req.user._id) {
    User.findByIdAndUpdate(req.user._id, { name, about }, { new: 'true', runValidators: true })
      .then((user) => res.send(user))
      .catch((err) => {
        if (err.name === 'ValidationError') {
          next(new BadRequestError(err.message));
        } else {
          next(err);
        }
      });
  } else {
    next(new NotFoundError('Пользователь с указанным id не найден'));
  }
};

module.exports.editUserAvatar = (req, res, next) => {
  if (req.user._id) {
    User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, { new: 'true', runValidators: true })
      .then((user) => res.send(user))
      .catch((err) => {
        if (err.name === 'ValidationError') {
          next(new BadRequestError(err.message));
        } else {
          next(err);
        }
      });
  } else {
    next(new NotFoundError('Пользователь с указанным id не найден'));
  }
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, 'some-secret-key', { expiresIn: '7d' });
      res.status(200).send({ token });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.getUserInfo = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      next(err);
    });
};
