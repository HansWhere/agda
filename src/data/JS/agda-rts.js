// Contains *most* of the primitives required by the JavaScript backend.
// (Some, e.g., those using Agda types like Maybe, are defined in their
// respective builtin modules.)
//
// Primitives prefixed by 'u' are uncurried variants, which are sometimes
// emitted by the JavaScript backend. Whenever possible, the curried primitives
// should be implemented in terms of the uncurried ones.
//
// Primitives prefixed by 'i' are internal variants, usually for those primitives
// which return Agda types like Maybe. These are never emitted by the compiler,
// but can be used internally to define other prefixes.

const biginteger = require("biginteger");

// Integers
exports.primIntegerFromString = function(x) {
  return biginteger.BigInteger(x);
};
exports.primShowInteger = function(x) {
  return x.toString();
};
exports.uprimIntegerPlus = function(x,y) {
  return x.add(y);
};
exports.uprimIntegerMinus = function(x,y) {
  return x.subtract(y);
};
exports.uprimIntegerMultiply = function(x,y) {
  return x.multiply(y);
};
exports.uprimIntegerRem = function(x, y) {
  return x.remainder(y);
};
exports.uprimIntegerQuot = function(x, y) {
  return x.quotient(y);
};
exports.uprimIntegerEqual = function(x,y) {
  return x.compare(y) == 0;
};
exports.uprimIntegerGreaterOrEqualThan = function(x,y) {
  return x.compare(y) >= 0;
};
exports.uprimIntegerLessThan = function(x,y) {
  return x.compare(y) == -1;
};

// Words
const WORD64_MAX_VALUE = exports.primIntegerFromString("18446744073709552000");

exports.primWord64ToNat = function(x) {
    return x;
};
exports.primWord64FromNat = function(x) {
    return x.remainder(WORD64_MAX_VALUE);
};
exports.uprimWord64Plus = function(x, y) {
    return x.add(y).remainder(WORD64_MAX_VALUE);
};
exports.uprimWord64Minus = function(x, y) {
    return x.add(WORD64_MAX_VALUE).subtract(y).remainder(WORD64_MAX_VALUE);
};
exports.uprimWord64Multiply = function(x, y) {
    return x.multiply(y).remainder(WORD64_MAX_VALUE);
};

// Natural numbers
exports.primNatMinus = function(x) {
  return function(y) {
    var z = x.subtract(y);
    if (z.isNegative()) {
      return biginteger.ZERO;
    } else {
      return z;
    }
  };
};

// Floating-point numbers
const igreatestCommonFactor = function(x, y) {
    var z;
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        z = x % y;
        x = y;
        y = z;
    }
    return x;
};
exports.iprimFloatRound = function(x) {
    if (Number.isNaN(x)) {
        return null;
    }
    else {
        return Math.round(x);
    }
};
exports.iprimFloatFloor = function(x) {
    if (Number.isNaN(x)) {
        return null;
    }
    else {
        return Math.floor(x);
    }
};
exports.iprimFloatCeiling = function(x) {
    if (Number.isNaN(x)) {
        return null;
    }
    else {
        return Math.ceil(x);
    }
};
exports.iprimFloatToRatio = function(x) {
    if (Number.isNaN(x)) {
        return {numerator:  0, denominator: 0};
    }
    else if (x > 0 && !Number.isFinite(x)) {
        return {numerator:  1, denominator: 0};
    }
    else if (x < 0 && !Number.isFinite(x)) {
        return {numerator: -1, denominator: 0};
    }
    else {
        var numerator = Math.round(x*1e9);
        var denominator = 1e9;
        var gcf = greatestCommonFactor(numerator, denominator);
        numerator /= greatestCommonFactor;
        denominator /= greatestCommonFactor;
        return {numerator: numerator, denominator: denominator};
    }
};
exports.iprimFloatDecode = function(x) {
    if (Number.isNaN(x)) {
        return null;
    }
    else if (x < 0.0 && !Number.isFinite(x)) {
        return null;
    }
    else if (0.0 < x && !Number.isFinite(x)) {
        return null;
    }
    else {
        var mantissa = x, exponent = 0;
        while (!Number.isInteger(mantissa)) {
            mantissa *= 2.0;
            exponent -= 1;
        };
        while (mantissa % 2.0 === 0) {
            mantissa /= 2.0;
            exponent += 1;
        }
        return {mantissa: mantissa, exponent: exponent};
    }
};
exports.uprimFloatEquality = function(x, y) {
    if (Number.isNaN(x) && Number.isNaN(y)) {
        return true;
    }
    else {
        return x === y;
    }
};
exports.primFloatEquality = function(x) {
    return function(y) {
        exports.uprimFloatEquality(x, y);
    };
};
exports.primFloatInequality = function(x) {
    return function(y) {
        return x <= y;
    };
};
exports.primFloatLess = function(x) {
    return function(y) {
        return x < y;
    };
};
exports.primFloatIsInfinite = function(x) {
    return !Number.isFinite(x) && !Number.isNaN(x);
};
exports.primFloatIsNaN = function(x) {
    return Number.isNaN(x);
};
exports.primFloatIsDenormalitd = function(x) {
    return false; // TODO: probably incorrect
};
exports.primFloatIsNegativeZero = function(x) {
    return Object.is(x, -0.0);
};
exports.primFloatIsSafeInteger = function(x) {
    return Number.isSafeInteger(x);
};


// These WORD64 values were obtained via `castDoubleToWord64` in Haskell:
const WORD64_NAN     = exports.primIntegerFromString("18444492273895866368");
const WORD64_POS_INF = exports.primIntegerFromString("9218868437227405312");
const WORD64_NEG_INF = exports.primIntegerFromString("18442240474082181120");

// Tests: 1.5 -> 4609434218613702656

exports.primFloatToWord64 = function(x) {
    if (Number.isNaN(x)) {
        return WORD64_NAN;
    }
    else if (x < 0.0 && !Number.isFinite(x)) {
        return WORD64_NEG_INF;
    }
    else if (0.0 < x && !Number.isFinite(x)) {
        return WORD64_POS_INF;
    }
    else {
        var mantissa, exponent;
        ({mantissa, exponent} = exports.iprimFloatDecode(x));
        var sign = Math.sign(mantissa);
        mantissa *= sign;
        sign = (sign === -1 ? "1" : "0");
        mantissa = ((mantissa >>> 0).toString(2)).padStart(11, "0");
        exponent = ((exponent >>> 0).toString(2)).padStart(52, "0");
        return exports.primIntegerFromString(
            parseInt(sign + mantissa + exponent, 2).toString());
    }
};
exports.primNatToFloat = function(x) {
    return x.valueOf();
};
exports.primIntToFloat = function(x) {
    return x.valueOf();
};
exports.primRatioToFloat = function(x) {
    return function(y) {
        return x.valueOf() / y.valueOf();
    };
};
exports.iprimFloatEncode = function(x) {
    return function(y) {
        var mantissa = x.valueOf();
        var exponent = y.valueOf();
        if (Number.isSafeInteger(mantissa) && -1024 <= exponent && exponent <= 1024) {
            return mantissa * (2 ** exponent);
        }
        else {
            return null;
        }
    };
};
exports.primShowFloat = function(x) {
    // See Issue #2192.
    if (Number.isInteger(x)) {
        if (exports.primFloatIsNegativeZero(x)) {
            return ("-0.0");
        } else {
            return (x.toString() + ".0");
        }
    } else {
        return x.toString();
    }
};
exports.primFloatPlus = function(x) {
    return function(y) {
        return x + y;
    };
};
exports.primFloatMinus = function(x) {
    return function(y) {
        return x - y;
    };
};
exports.primFloatTimes = function(x) {
    return function(y) {
        return x * y;
    };
};
exports.primFloatNegate = function(x) {
    return -x;
};
exports.primFloatDiv = function(x) {
  return function(y) {
    return x / y;
  };
};
exports.primFloatSqrt = function(x) {
    return Math.sqrt(x);
};
exports.primFloatExp = function(x) {
    return Math.exp(x);
};
exports.primFloatExp = function(x) {
    return Math.log(x);
};
exports.primFloatSin = function(x) {
    return Math.sin(x);
};
exports.primFloatCos = function(x) {
    return Math.cos(x);
};
exports.primFloatTan = function(x) {
    return Math.tan(x);
};
exports.primFloatASin = function(x) {
    return Math.asin(x);
};
exports.primFloatACos = function(x) {
    return Math.acos(x);
};
exports.primFloatATan = function(x) {
    return Math.atan(x);
};
exports.primFloatATan2 = function(x) {
    return function(y){
        return Math.atan2(x, y);
    };
};

// Other stuff
exports.primSeq = function(x, y) {
  return y;
};
exports.uprimQNameEquality = function(x,y) {
    return x["id"].compare(y["id"]) == 0 && x["moduleId"].compare(y["moduleId"]) == 0;
};
exports.primQNameEquality = function(x) {
    return function(y) {
        return exports.uprimQNameEquality(x, y);
    };
};
exports.primQNameLess = function(x) {
  return function(y) {
    switch (x["id"].compare(y["id"])) {
      case -1: return true;
      case  1: return false;
      default: return x["moduleId"].compare(y["moduleId"]) == -1;
    };
  };
};
exports.primShowQName = function(x) {
    return x["name"];
};
exports.primQNameFixity = function(x) {
    return x["fixity"];
};


