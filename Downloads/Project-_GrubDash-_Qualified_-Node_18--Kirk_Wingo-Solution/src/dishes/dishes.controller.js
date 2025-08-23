const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body || {};
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body || {};
  if (price === undefined) {
    return next({ status: 400, message: "Dish must include a price" });
  }
  if (typeof price !== "number" || price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

// existence check
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((d) => d.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}` });
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function create(req, res) {
  const { data = {} } = req.body || {};
  const { name, description, price, image_url } = data;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body || {};
  const { dishId } = req.params;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data = {} } = req.body || {};
  const { name, description, price, image_url } = data;

  // dishes update
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}


module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyHas("name"),
    bodyHas("description"),
    priceIsValid,
    bodyHas("image_url"),
    create,
  ],
  update: [
    dishExists,
    idMatches,
    bodyHas("name"),
    bodyHas("description"),
    priceIsValid,
    bodyHas("image_url"),
    update,
  ],
};