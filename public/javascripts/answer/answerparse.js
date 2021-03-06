// Generated by CoffeeScript 1.3.3
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function() {
    var checkAnswer, damlev, parseAnswer, removeDiacritics, stopwords;
    removeDiacritics = require('./removeDiacritics').removeDiacritics;
    damlev = require('./levenshtein').levenshtein;
    stopwords = 'dont,accept,either,underlined,prompt,on,in,to,the,of,is,a,read,mentioned,before,that,have,word,equivalents,forms,jr,sr,dr,phd,etc,a'.toLowerCase().split(',');
    parseAnswer = function(answer) {
      var clean, comp, neg, part, pos, _i, _len;
      answer = answer.replace(/[\[\]\<\>\{\}][\w\-]+?[\[\]\<\>\{\}]/g, '');
      clean = (function() {
        var _i, _len, _ref, _results;
        _ref = answer.split(/[^\w]and[^\w]|[^\w]or[^\w]|\[|\]|\{|\}|\;|\,|\<|\>|\(|\)/g);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          _results.push(part.trim());
        }
        return _results;
      })();
      clean = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = clean.length; _i < _len; _i++) {
          part = clean[_i];
          if (part !== '') {
            _results.push(part);
          }
        }
        return _results;
      })();
      pos = [];
      neg = [];
      for (_i = 0, _len = clean.length; _i < _len; _i++) {
        part = clean[_i];
        part = removeDiacritics(part);
        part = part.replace(/\"|\'|\“|\”|\.|’|\:/g, '');
        part = part.replace(/-/g, ' ');
        if (/equivalent|word form|other wrong/.test(part)) {

        } else if (/do not|dont/.test(part)) {
          neg.push(part);
        } else if (/accept/.test(part)) {
          comp = part.split(/before|until/);
          if (comp.length > 1) {
            neg.push(comp[1]);
          }
          pos.push(comp[0]);
        } else {
          pos.push(part);
        }
      }
      return [pos, neg];
    };
    checkAnswer = function(compare, answer) {
      var accepts, index, len, list, max, neg, p, p2, pos, score, scores, sorted, str, sum, weight, weighted, word, _i, _len, _ref;
      compare = removeDiacritics(compare).trim().split(' ');
      _ref = parseAnswer(answer.trim()), pos = _ref[0], neg = _ref[1];
      accepts = [];
      for (_i = 0, _len = pos.length; _i < _len; _i++) {
        p = pos[_i];
        list = (function() {
          var _j, _len1, _ref1, _ref2, _results;
          _ref1 = p.split(/\s/);
          _results = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            word = _ref1[_j];
            if ((_ref2 = word.toLowerCase().trim(), __indexOf.call(stopwords, _ref2) < 0) && word.trim() !== '') {
              _results.push(word);
            }
          }
          return _results;
        })();
        if (list.length > 0) {
          sum = 0;
          p2 = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = compare.length; _j < _len1; _j++) {
              word = compare[_j];
              scores = (function() {
                var _k, _ref1, _results1;
                _results1 = [];
                for (index = _k = 0, _ref1 = list.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; index = 0 <= _ref1 ? ++_k : --_k) {
                  score = damlev(list[index].toLowerCase(), word.toLowerCase());
                  if (list[index].toLowerCase()[0] !== word.toLowerCase()[0]) {
                    score += 2;
                  }
                  if (list[index].toLowerCase()[1] !== word.toLowerCase()[1]) {
                    score += 1;
                  }
                  _results1.push([index, score]);
                }
                return _results1;
              })();
              sorted = scores.sort(function(_arg, _arg1) {
                var a, b, w, z;
                w = _arg[0], a = _arg[1];
                z = _arg1[0], b = _arg1[1];
                return a - b;
              });
              index = sorted[0][0];
              weight = 1;
              if (index === 0) {
                weight = 1.5;
              }
              if (index === list.length - 1) {
                weight = 1.5;
              }
              weighted = list[index].length - Math.pow(sorted[0][1], 1.0) * weight;
              _results.push(sum += weighted);
            }
            return _results;
          })();
          accepts.push([list, sum]);
        }
      }
      max = accepts.sort(function(_arg, _arg1) {
        var a, b, w, z;
        w = _arg[0], a = _arg[1];
        z = _arg1[0], b = _arg1[1];
        return b - a;
      });
      str = max[0][0];
      len = str.join('').length;
      score = max[0][1];
      console.log(str, score, compare.join(' '));
      if (score > len * 0.6 || score > 5) {
        return true;
      }
      return false;
    };
    exports.checkAnswer = checkAnswer;
    return exports.parseAnswer = parseAnswer;
  })();

}).call(this);
