var verbosityOn = true;

const initialHandlers = {
  effects: {},
  coeffects: {},
  events: {}
};

let handlers = { ...initialHandlers };
let coeffectsByEvent = {};

function extractCoeffectsValues(coeffectDescriptions) {
  return coeffectDescriptions.reduce(function (acc, coeffectDescription) {
    if (isString(coeffectDescription)) {
      const coeffectId = coeffectDescription;
      const coeffectHandler = getCoeffectHandler(coeffectId);
      return Object.assign({}, acc, coeffectHandler());
    }

    guardValidCoeffectDescriptionObject(coeffectDescription);

    const coeffectId = coeffectDescription.id;
    const coeffectData = coeffectDescription.data;
    const coeffectHandler = getCoeffectHandler(coeffectId);
    return Object.assign({}, acc, coeffectHandler(coeffectData));
  }, {});
}

function guardValidCoeffectDescriptionObject(coeffectDescription) {
  if (!coeffectDescription || coeffectDescription.id == null) {
    throw new Error("Coeffect description is not a valid object, an id property is required");
  }
}

function applyEffects(effects) {
  if (!effects) {
    return;
  }
  const effectIds = Object.keys(effects);

  effectIds.forEach(function (effectId) {
    const effectData = effects[effectId];
    const effectHandler = getEffectHandler(effectId);

    effectHandler(effectData);
  });
}

export function dispatch({eventId, payload = {}}) {
  if (verbosityOn) {
    console.log(`Dispatching event ${eventId} with payload ${payload}`);
  }
  const eventHandler = getEventHandler(eventId);
  const coeffectDescriptions = coeffectsByEvent[eventId];
  const coeffects = extractCoeffectsValues(coeffectDescriptions);
  const effects = eventHandler(coeffects, payload);
  applyEffects(effects);
}

function dispatchMany(events) {
  events.forEach(function (event) {
    dispatch(event);
  });
}

function dispatchLater(event) {
  const t1 = new Date().getTime();
  setTimeout(function () {
    dispatch(event);
  }, event.milliseconds);
}

export function registerEventHandler(eventId, handler, coeffectDescriptions = []) {
  setHandler('events', eventId, handler);
  coeffectsByEvent[eventId] = coeffectDescriptions;
}

export function registerCoeffectHandler(coeffectId, handler) {
  setHandler('coeffects', coeffectId, handler);
}

export function registerEffectHandler(effectId, handler) {
  setHandler('effects', effectId, handler);
}

registerEffectHandler("dispatch", function dispatchEffect(event) {
  dispatch(event);
});

registerEffectHandler("dispatchMany", function dispatchManyEffect(events) {
  dispatchMany(events)
});

registerEffectHandler("dispatchLater", function dispatchLaterEffect(event) {
  dispatchLater(event);
});

function getHandler(handlerType, handlerId) {
  const handler = handlers[handlerType][handlerId];
  if (!handler) {
    throw new Error(`There is no ${handler} handler called '${handlerId}'.`);
  }
  return handler;
}

function setHandler(handlerType, handlerId, handler) {
  handlers[handlerType][handlerId] = handler;
}

export function getCoeffectHandler(coeffectId) {
  return getHandler('coeffects', coeffectId);
}

export function getEffectHandler(effectId) {
  return getHandler('effects', effectId);
}

export function getEventHandler(eventId) {
  return getHandler('events', eventId);
}

export function clearHandlers() {
  handlers = { ...initialHandlers };
  coeffectsByEvent = {};
}

export function setVerbosity(newValue) {
  verbosityOn = newValue;
}

const toString = Object.prototype.toString

function isString(value) {
  const type = typeof value
  return type === 'string' || (type === 'object' && value != null && !Array.isArray(value) && toString.call(value) === '[object String]')
}
