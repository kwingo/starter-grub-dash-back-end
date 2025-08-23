const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function bodyHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body || {};
    if (data[propertyName]) return next();
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function dishesIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body || {};
  if (!dishes) {
    return next({ status: 400, message: "Order must include a dish" });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  
   for (let index = 0; index < dishes.length; index++) {
    const dish = dishes[index];
    const quantity = dish.quantity;
    if (
      quantity === undefined ||
      quantity === null ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}


const VALID_STATUSES = ["pending", "preparing", "out-for-delivery", "delivered"];

function statusIsValidForUpdate(req, res, next) {
  const { data: { status } = {} } = req.body || {};

  if (!status || status === "") {
    return next({ status: 400, message: "Order must have a status" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  // Here's where the order is delivered and can't be changed. 
  if (res.locals.order && res.locals.order.status === "delivered") {
    return next({ status: 400, message: "A delivered order cannot be changed" });
  }

  next();
}

// Handlers 
function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const { data = {} } = req.body || {};
  const { deliverTo, mobileNumber, dishes } = data;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: data.status ? data.status : "pending",
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const order = res.locals.order;
  const { data = {} } = req.body || {};
  const { deliverTo, mobileNumber, status, dishes } = data;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  const index = orders.findIndex((o) => o.id === order.id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const found = orders.find((o) => o.id === orderId);
  if (found) {
    res.locals.order = found;
    return next();
  }
  next({ status: 404, message: `Order not found: ${orderId}` });
}

function idMatches(req, res, next) {
  const { data: { id } = {} } = req.body || {};
  const { orderId } = req.params;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

// Exports
module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    dishesIsValid,
    create,
  ],
  update: [
    orderExists,
    idMatches,
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    dishesIsValid,
    statusIsValidForUpdate,
    update,
  ],
  delete: [orderExists, destroy],
};
