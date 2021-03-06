// Generated by CoffeeScript 1.3.3
(function() {
  var actionMode, addAnnotation, addImportant, avg, changeQuestion, chatAnnotation, computeScore, connected, createBundle, createStatSheet, cumsum, formatTime, guessAnnotation, handleCacheEvent, inner_socket, last_question, latency_log, mobileLayout, public_id, public_name, removeSplash, renderPartial, renderState, renderTimer, serverTime, setActionMode, sock, stdev, sum, sync, sync_offset, sync_offsets, synchronize, testLatency, time, userSpan, users,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  if (typeof io !== "undefined" && io !== null) {
    inner_socket = io.connect();
  }

  sync = {};

  users = {};

  sync_offsets = [];

  sync_offset = 0;

  sock = {
    listeners: {},
    disconnect: function() {
      var virtual_connect;
      if (inner_socket.socket.connecting) {
        virtual_connect = function() {
          if (typeof virtual_server !== "undefined" && virtual_server !== null) {
            return virtual_server.connect();
          } else {
            return setTimeout(virtual_connect, 100);
          }
        };
        virtual_connect();
      }
      return inner_socket.disconnect();
    },
    emit: function(name, data, fn) {
      var el, result;
      if (connected()) {
        return inner_socket.emit(name, data, fn);
      } else if (typeof virtual_server !== "undefined" && virtual_server !== null) {
        if (name in virtual_server) {
          result = virtual_server[name](data);
          if (fn) {
            return fn(result);
          }
        } else {
          return console.log(name, data, fn);
        }
      } else {
        if ($('.active .not-loaded').length > 0) {
          el = $('.active .not-loaded');
        } else {
          el = $('<p>').addClass('not-loaded');
          addImportant(el);
        }
        el.data('num', (el.data('num') || 0) + 1);
        el.text("Offline component not loaded ");
        if (el.data('num') > 1) {
          return el.append($('<span>').addClass('label').text("x" + el.data('num')));
        }
      }
    },
    server_emit: function(name, data) {
      return sock.listeners[name](data);
    },
    on: function(name, listen) {
      if (inner_socket != null) {
        inner_socket.on(name, listen);
      }
      return sock.listeners[name] = listen;
    }
  };

  if (typeof io === "undefined" || io === null) {
    $('.new-room').remove();
  }

  connected = function() {
    return (inner_socket != null) && inner_socket.socket.connected;
  };

  jQuery.fn.disable = function(value) {
    var current;
    current = $(this).attr('disabled') === 'disabled';
    if (current !== value) {
      return $(this).attr('disabled', value);
    }
  };

  mobileLayout = function() {
    return matchMedia('(max-width: 768px)').matches;
  };

  avg = function(list) {
    return sum(list) / list.length;
  };

  sum = function(list) {
    var item, s, _i, _len;
    s = 0;
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      item = list[_i];
      s += item;
    }
    return s;
  };

  stdev = function(list) {
    var item, mu;
    mu = avg(list);
    return Math.sqrt(avg((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        item = list[_i];
        _results.push((item - mu) * (item - mu));
      }
      return _results;
    })()));
  };

  cumsum = function(list, rate) {
    var num, s, _i, _len, _ref, _results;
    s = 0;
    _ref = [1].concat(list).slice(0, -1);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      num = _ref[_i];
      _results.push(s += Math.round(num) * rate);
    }
    return _results;
  };

  time = function() {
    if (sync.time_freeze) {
      return sync.time_freeze;
    } else {
      return serverTime() - sync.time_offset;
    }
  };

  serverTime = function() {
    return new Date - sync_offset;
  };

  window.onbeforeunload = function() {
    if (inner_socket != null) {
      localStorage.old_socket = inner_socket.socket.sessionid;
    }
    return null;
  };

  sock.on('echo', function(data, fn) {
    return fn('alive');
  });

  sock.on('disconnect', function() {
    var line, _ref;
    if (((_ref = sync.attempt) != null ? _ref.user : void 0) !== public_id) {
      sync.attempt = null;
    }
    line = $('<div>').addClass('well');
    line.append($('<p>').append("You were ", $('<span class="label label-important">').text("disconnected"), " from the server for some reason. ", $('<em>').text(new Date)));
    line.append($('<p>').append("This may be due to a drop in the network       connectivity or a malfunction in the server. The client will automatically       attempt to reconnect to the server and in the mean time, the app has automatically transitioned      into <b>offline mode</b>. You can continue playing alone with a limited offline set      of questions without interruption. However, you might want to try <a href=''>reloading</a>."));
    addImportant($('<div>').addClass('log disconnect-notice').append(line));
    sock.emit('init_offline', 'yay');
    return renderState();
  });

  sock.on('application_update', function() {
    if (typeof applicationCache !== "undefined" && applicationCache !== null) {
      return applicationCache.update();
    }
  });

  public_name = null;

  public_id = null;

  sock.on('connect', function() {
    $('.actionbar button').disable(false);
    $('.timer').removeClass('disabled');
    $('.disconnect-notice').slideUp();
    return sock.emit('join', {
      old_socket: localStorage.old_socket,
      room_name: channel_name
    }, function(data) {
      public_name = data.name;
      public_id = data.id;
      $('#username').val(public_name);
      $('#username').disable(false);
      return $('.settings').slideDown();
    });
  });

  $('#username').keyup(function() {
    if ($(this).val().length > 0) {
      return sock.emit('rename', $(this).val());
    }
  });

  synchronize = function(data) {
    var attr, below, item, thresh;
    if (data) {
      sync_offsets.push(+(new Date) - data.real_time);
      thresh = avg(sync_offsets);
      below = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sync_offsets.length; _i < _len; _i++) {
          item = sync_offsets[_i];
          if (item <= thresh) {
            _results.push(item);
          }
        }
        return _results;
      })();
      sync_offset = avg(below);
      $('#sync_offset').text(sync_offset.toFixed(1) + '/' + stdev(below).toFixed(1) + (" (" + sync_offsets.length + ")"));
      for (attr in data) {
        sync[attr] = data[attr];
      }
    }
    if (!data || 'users' in data) {
      renderState();
    } else {
      renderPartial();
    }
    if (sync.attempt) {
      if (sync.attempt.user !== public_id) {
        if (actionMode === 'guess') {
          return setActionMode('');
        }
      }
    }
  };

  sock.on('sync', function(data) {
    return synchronize(data);
  });

  latency_log = [];

  testLatency = function() {
    var initialTime;
    if (!connected()) {
      return;
    }
    initialTime = +(new Date);
    return sock.emit('echo', {}, function(firstServerTime) {
      var recieveTime;
      recieveTime = +(new Date);
      return sock.emit('echo', {}, function(secondServerTime) {
        var CSC1, CSC2, SCS1, secondTime;
        secondTime = +(new Date);
        CSC1 = recieveTime - initialTime;
        CSC2 = secondTime - recieveTime;
        SCS1 = secondServerTime - firstServerTime;
        latency_log.push(CSC1);
        latency_log.push(SCS1);
        return latency_log.push(CSC2);
      });
    });
  };

  setTimeout(function() {
    testLatency();
    return setInterval(testLatency, 30 * 1000);
  }, 2500);

  last_question = null;

  sock.on('chat', function(data) {
    return chatAnnotation(data);
  });

  /*
    Correct: 10pts
    Early: 15pts
    Interrupts: -5pts
  */


  computeScore = function(user) {
    var CORRECT, EARLY, INTERRUPT;
    CORRECT = 10;
    EARLY = 15;
    INTERRUPT = -5;
    return user.early * EARLY + (user.correct - user.early) * CORRECT + user.interrupts * INTERRUPT;
  };

  formatTime = function(timestamp) {
    var date;
    date = new Date;
    date.setTime(timestamp);
    return (date.getHours() % 12) + ':' + ('0' + date.getMinutes()).substr(-2, 2) + (date.getHours() > 12 ? "pm" : "am");
  };

  createStatSheet = function(user, full) {
    var body, row, table;
    table = $('<table>').addClass('table headless');
    body = $('<tbody>').appendTo(table);
    row = function(name, val) {
      return $('<tr>').appendTo(body).append($("<th>").text(name)).append($("<td>").addClass("value").text(val));
    };
    if (full) {
      row("ID", user.id.slice(0, 10));
    }
    row("Score", computeScore(user));
    row("Correct", user.correct);
    row("Interrupts", user.interrupts);
    if (full) {
      row("Early", user.early);
    }
    if (full) {
      row("Incorrect", user.guesses - user.correct);
    }
    row("Guesses", user.guesses);
    if (full) {
      row("Last Seen", formatTime(user.last_action));
    }
    return table;
  };

  renderState = function() {
    var action, badge, count, list, name, row, user, votes, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    if (sync.users) {
      _ref = sync.users;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        user = _ref[_i];
        votes = [];
        for (action in sync.voting) {
          if (_ref1 = user.id, __indexOf.call(sync.voting[action], _ref1) >= 0) {
            votes.push(action);
          }
        }
        user.votes = votes.join(', ');
        users[user.id] = user;
      }
      list = $('.leaderboard tbody');
      count = 0;
      list.find('tr').addClass('to_remove');
      _ref2 = sync.users.sort(function(a, b) {
        return computeScore(b) - computeScore(a);
      });
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        user = _ref2[_j];
        $('.user-' + user.id).text(user.name);
        count++;
        row = list.find('.sockid-' + user.id);
        list.append(row);
        if (row.length < 1) {
          row = $('<tr>').appendTo(list);
          row.popover({
            placement: function() {
              if (mobileLayout()) {
                return "top";
              } else {
                return "left";
              }
            },
            trigger: 'manual'
          });
          row.click(function() {
            $('.leaderboard tbody tr').not(this).popover('hide');
            return $(this).popover('toggle');
          });
        }
        row.attr('data-original-title', "<span class='user-" + user.id + "'>" + user.name + "</span>'s stats");
        row.attr('data-content', $('<div>').append(createStatSheet(user, true)).html());
        row.find('td').remove();
        row.addClass('sockid-' + user.id);
        row.removeClass('to_remove');
        badge = $('<span>').addClass('badge').text(computeScore(user));
        if (user.id === public_id) {
          badge.addClass('badge-info');
          badge.attr('title', 'You');
          $('.singleuser .stats table').replaceWith(createStatSheet(user, !!$('.singleuser').data('full')));
        } else {
          if (user.online) {
            if (serverTime() - user.last_action > 1000 * 60 * 10) {
              badge.addClass('badge-warning');
              badge.attr('title', 'Idle');
            } else {
              badge.addClass('badge-success');
              badge.attr('title', 'Online');
            }
          }
        }
        $('<td>').text(count).append('&nbsp;').append(badge).appendTo(row);
        name = $('<td>').text(user.name);
        name.appendTo(row);
        $('<td>').text(user.interrupts).appendTo(row);
      }
      list.find('tr.to_remove').remove();
      if (sync.users.length > 1 && connected()) {
        $('.leaderboard').slideDown();
        $('.singleuser').slideUp();
      } else {
        $('.leaderboard').slideUp();
        $('.singleuser').slideDown();
      }
    }
    $(window).resize();
    return renderPartial();
  };

  $('.singleuser').click(function() {
    return $('.singleuser .stats').slideUp().queue(function() {
      $('.singleuser').data('full', !$('.singleuser').data('full'));
      renderState();
      return $(this).dequeue().slideDown();
    });
  });

  renderPartial = function() {
    var bundle, children, cumulative, element, elements, i, index, label_type, new_text, old_spots, old_text, spots, timeDelta, unread, visible, words, wpm, _i, _j, _ref, _ref1;
    if (!(sync.question && sync.timing)) {
      return;
    }
    wpm = Math.round(1000 * 60 / 5 / sync.rate);
    if (!$(document.activeElement).is(".speed")) {
      if (Math.abs($('.speed').val() - wpm) > 1) {
        $('.speed').val(wpm);
      }
    }
    if (sync.question !== last_question) {
      changeQuestion();
      last_question = sync.question;
    }
    if (!sync.time_freeze) {
      removeSplash();
    }
    timeDelta = time() - sync.begin_time;
    words = sync.question.split(' ');
    cumulative = cumsum(sync.timing, sync.rate);
    index = 0;
    while (timeDelta > cumulative[index]) {
      index++;
    }
    bundle = $('#history .bundle.active');
    new_text = words.slice(0, index).join(' ').trim();
    old_text = bundle.find('.readout .visible').text().replace(/\s+/g, ' ').trim();
    spots = bundle.data('starts') || [];
    visible = bundle.find('.readout .visible');
    unread = bundle.find('.readout .unread');
    old_spots = visible.data('spots') === spots.join(',');
    if (new_text !== old_text || !old_spots) {
      visible.data('spots', spots.join(','));
      unread.text('');
      children = visible.children();
      children.slice(index).remove();
      elements = [];
      for (i = _i = 0, _ref = words.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        element = $('<span>');
        if (words[i].indexOf('*') !== -1) {
          element.append(" <span class='inline-icon'><span class='asterisk'>" + words[i] + "</span><i class='label icon-white icon-asterisk'></i></span> ");
        } else {
          element.append(words[i] + " ");
        }
        if (__indexOf.call(spots, i) >= 0) {
          label_type = 'label-important';
          if (i === words.length - 1) {
            label_type = "label-info";
          }
          element.append(" <span class='inline-icon'><i class='label icon-white icon-bell  " + label_type + "'></i></span> ");
        }
        elements.push(element);
      }
      for (i = _j = 0, _ref1 = words.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        if (i < index) {
          if (children.eq(i).html() !== elements[i].html()) {
            children.slice(i).remove();
            visible.append(elements[i]);
          }
        } else {
          unread.append(elements[i].contents());
        }
      }
    }
    renderTimer();
    if (sync.attempt) {
      guessAnnotation(sync.attempt);
    }
    if (latency_log.length > 0) {
      return $('#latency').text(avg(latency_log).toFixed(1) + "/" + stdev(latency_log).toFixed(1) + (" (" + latency_log.length + ")"));
    }
  };

  setInterval(renderState, 10000);

  setInterval(renderPartial, 50);

  renderTimer = function() {
    var cs, elapsed, min, ms, pad, progress, sec, sign;
    if (connected()) {
      $('.offline').fadeOut();
    } else {
      $('.offline').fadeIn();
    }
    if (sync.time_freeze) {
      if (sync.attempt) {
        (function() {
          var cumulative, del, i, starts, _ref;
          cumulative = cumsum(sync.timing, sync.rate);
          del = sync.attempt.start - sync.begin_time;
          i = 0;
          while (del > cumulative[i]) {
            i++;
          }
          starts = $('.bundle.active').data('starts') || [];
          if (_ref = i - 1, __indexOf.call(starts, _ref) < 0) {
            starts.push(i - 1);
          }
          return $('.bundle.active').data('starts', starts);
        })();
        $('.label.pause').hide();
        $('.label.buzz').fadeIn();
      } else {
        $('.label.pause').fadeIn();
        $('.label.buzz').hide();
      }
      if ($('.pausebtn').text() !== 'Resume') {
        $('.pausebtn').text('Resume').addClass('btn-success').removeClass('btn-warning');
      }
    } else {
      $('.label.pause').fadeOut();
      $('.label.buzz').fadeOut();
      if ($('.pausebtn').text() !== 'Pause') {
        $('.pausebtn').text('Pause').addClass('btn-warning').removeClass('btn-success');
      }
    }
    $('.timer').toggleClass('buzz', !!sync.attempt);
    $('.progress').toggleClass('progress-warning', !!(sync.time_freeze && !sync.attempt));
    $('.progress').toggleClass('active progress-danger', !!sync.attempt);
    if (sync.attempt) {
      elapsed = serverTime() - sync.attempt.realTime;
      ms = sync.attempt.duration - elapsed;
      progress = elapsed / sync.attempt.duration;
      $('.pausebtn, .buzzbtn').disable(true);
    } else {
      ms = sync.end_time - time();
      elapsed = time() - sync.begin_time;
      progress = elapsed / (sync.end_time - sync.begin_time);
      $('.pausebtn').disable(ms < 0);
      $('.buzzbtn').disable(ms < 0 || elapsed < 100);
      if (ms < 0) {
        $('.bundle.active').find('.answer').css('visibility', 'visible');
      }
    }
    if ($('.progress .bar').hasClass('pull-right')) {
      $('.progress .bar').width((1 - progress) * 100 + '%');
    } else {
      $('.progress .bar').width(progress * 100 + '%');
    }
    ms = Math.max(0, ms);
    sign = "";
    if (ms < 0) {
      sign = "+";
    }
    sec = Math.abs(ms) / 1000;
    cs = (sec % 1).toFixed(1).slice(1);
    $('.timer .fraction').text(cs);
    min = sec / 60;
    pad = function(num) {
      var str;
      str = Math.floor(num).toString();
      while (str.length < 2) {
        str = '0' + str;
      }
      return str;
    };
    return $('.timer .face').text(sign + pad(min) + ':' + pad(sec % 60));
  };

  removeSplash = function(fn) {
    var bundle, start;
    bundle = $('.bundle.active');
    start = bundle.find('.start-page');
    if (start.length > 0) {
      bundle.find('.readout').width(start.width()).slideDown('normal', function() {
        return $(this).width('auto');
      });
      return start.slideUp('normal', function() {
        start.remove();
        if (fn) {
          return fn();
        }
      });
    } else {
      if (fn) {
        return fn();
      }
    }
  };

  changeQuestion = function() {
    var bundle, cutoff, nested, old, start, well;
    cutoff = 15;
    if (mobileLayout()) {
      cutoff = 1;
    }
    $('.bundle:not(.bookmarked)').slice(cutoff).slideUp('normal', function() {
      return $(this).remove();
    });
    old = $('#history .bundle').first();
    old.removeClass('active');
    old.find('.breadcrumb').click(function() {
      return 1;
    });
    bundle = createBundle().width($('#history').width());
    bundle.addClass('active');
    $('#history').prepend(bundle.hide());
    if (!last_question && sync.time_freeze && sync.time_freeze - sync.begin_time < 500) {
      start = $('<div>').addClass('start-page');
      well = $('<div>').addClass('well').appendTo(start);
      $('<button>').addClass('btn btn-success btn-large').text('Start the Question').appendTo(well).click(function() {
        return removeSplash(function() {
          return $('.pausebtn').click();
        });
      });
      bundle.find('.readout').hide().before(start);
    }
    bundle.slideDown("slow").queue(function() {
      bundle.width('auto');
      return $(this).dequeue();
    });
    if (old.find('.readout').length > 0) {
      nested = old.find('.readout .visible>span');
      old.find('.readout .visible').append(nested.contents());
      nested.remove();
      old.find('.readout')[0].normalize();
      return old.queue(function() {
        old.find('.readout').slideUp("slow");
        return $(this).dequeue();
      });
    }
  };

  createBundle = function() {
    var addInfo, annotations, breadcrumb, bundle, important, readout, star, well;
    bundle = $('<div>').addClass('bundle');
    important = $('<div>').addClass('important');
    bundle.append(important);
    breadcrumb = $('<ul>').addClass('breadcrumb');
    addInfo = function(name, value) {
      breadcrumb.find('li').last().append($('<span>').addClass('divider').text('/'));
      return breadcrumb.append($('<li>').text(name + ": " + value));
    };
    addInfo('Category', sync.info.category);
    addInfo('Difficulty', sync.info.difficulty);
    addInfo('Tournament', sync.info.year + ' ' + sync.info.tournament);
    breadcrumb.find('li').last().append($('<span>').addClass('divider').text('/'));
    breadcrumb.append($('<li>').addClass('clickable').text('Report').click(function(e) {
      console.log('report question');
      $('#report-question').modal('show');
      e.stopPropagation();
      return e.preventDefault();
    }));
    star = $('<a>', {
      href: "#",
      rel: "tooltip",
      title: "Bookmark this question"
    }).addClass('icon-star-empty bookmark').click(function(e) {
      bundle.toggleClass('bookmarked');
      star.toggleClass('icon-star-empty', !bundle.hasClass('bookmarked'));
      star.toggleClass('icon-star', bundle.hasClass('bookmarked'));
      e.stopPropagation();
      return e.preventDefault();
    });
    breadcrumb.append($('<li>').addClass('pull-right').append(star));
    breadcrumb.append($('<li>').addClass('pull-right answer').text(sync.answer));
    readout = $('<div>').addClass('readout');
    well = $('<div>').addClass('well').appendTo(readout);
    well.append($('<span>').addClass('visible'));
    well.append(document.createTextNode(' '));
    well.append($('<span>').addClass('unread').text(sync.question));
    annotations = $('<div>').addClass('annotations');
    return bundle.append(breadcrumb).append(readout).append(annotations);
  };

  userSpan = function(user) {
    var _ref;
    return $('<span>').addClass('user-' + user).text(((_ref = users[user]) != null ? _ref.name : void 0) || '[name missing]');
  };

  addAnnotation = function(el) {
    el.css('display', 'none').prependTo($('#history .bundle.active .annotations'));
    el.slideDown();
    return el;
  };

  addImportant = function(el) {
    el.css('display', 'none').prependTo($('#history .bundle.active .important'));
    el.slideDown();
    return el;
  };

  guessAnnotation = function(_arg) {
    var answer, correct, done, early, id, interrupt, line, marker, ruling, session, text, user;
    session = _arg.session, text = _arg.text, user = _arg.user, done = _arg.done, correct = _arg.correct, interrupt = _arg.interrupt, early = _arg.early;
    id = user + '-' + session;
    if ($('#' + id).length > 0) {
      line = $('#' + id);
    } else {
      line = $('<p>').attr('id', id);
      marker = $('<span>').addClass('label').text("Buzz");
      if (early) {

      } else if (interrupt) {
        marker.addClass('label-important');
      } else {
        marker.addClass('label-info');
      }
      line.append(marker);
      line.append(" ");
      line.append(userSpan(user).addClass('author'));
      line.append(document.createTextNode(' '));
      $('<span>').addClass('comment').appendTo(line);
      ruling = $('<a>').addClass('label ruling').hide().attr('href', '#');
      line.append(' ');
      line.append(ruling);
      addAnnotation(line);
    }
    if (done) {
      if (text === '') {
        line.find('.comment').html('<em>(blank)</em>');
      } else {
        line.find('.comment').text(text);
      }
    } else {
      line.find('.comment').text(text);
    }
    if (done) {
      ruling = line.find('.ruling').show().css('display', 'inline');
      if (correct) {
        ruling.addClass('label-success').text('Correct');
      } else {
        ruling.addClass('label-warning').text('Wrong');
      }
      answer = sync.answer;
      ruling.click(function() {
        $('#review .review-judgement').after(ruling.clone().addClass('review-judgement')).remove();
        $('#review .review-answer').text(answer);
        $('#review .review-response').text(text);
        $('#review').modal('show');
        return false;
      });
      if (actionMode === 'guess') {
        return setActionMode('');
      }
    }
  };

  chatAnnotation = function(_arg) {
    var done, id, line, session, text, time, user;
    session = _arg.session, text = _arg.text, user = _arg.user, done = _arg.done, time = _arg.time;
    id = user + '-' + session;
    if ($('#' + id).length > 0) {
      line = $('#' + id);
    } else {
      line = $('<p>').attr('id', id);
      line.append(userSpan(user).addClass('author').attr('title', formatTime(time)));
      line.append(document.createTextNode(' '));
      $('<span>').addClass('comment').appendTo(line);
      addAnnotation(line);
    }
    if (done) {
      if (text === '') {
        line.find('.comment').html('<em>(no message)</em>');
      } else {
        line.find('.comment').text(text);
      }
    } else {
      line.find('.comment').text(text);
    }
    return line.toggleClass('typing', !done);
  };

  sock.on('introduce', function(_arg) {
    var line, user;
    user = _arg.user;
    line = $('<p>').addClass('log');
    line.append(userSpan(user));
    line.append(" joined the room");
    return addAnnotation(line);
  });

  sock.on('leave', function(_arg) {
    var line, user;
    user = _arg.user;
    line = $('<p>').addClass('log');
    line.append(userSpan(user));
    line.append(" left the room");
    return addAnnotation(line);
  });

  jQuery('.bundle .breadcrumb').live('click', function() {
    var readout;
    if (!$(this).is(jQuery('.bundle .breadcrumb').first())) {
      readout = $(this).parent().find('.readout');
      return readout.width($('#history').width()).slideToggle("slow", function() {
        return readout.width('auto');
      });
    }
  });

  actionMode = '';

  setActionMode = function(mode) {
    actionMode = mode;
    $('.prompt_input, .guess_input, .chat_input').blur();
    $('.actionbar').toggle(mode === '');
    $('.chat_form').toggle(mode === 'chat');
    $('.guess_form').toggle(mode === 'guess');
    $('.prompt_form').toggle(mode === 'prompt');
    return $(window).resize();
  };

  $('.chatbtn').click(function() {
    setActionMode('chat');
    return $('.chat_input').data('input_session', Math.random().toString(36).slice(3)).val('').focus();
  });

  $('.skipbtn').click(function() {
    removeSplash();
    return sock.emit('skip', 'yay');
  });

  $('.buzzbtn').click(function() {
    if ($('.buzzbtn').attr('disabled') === 'disabled') {
      return;
    }
    setActionMode('guess');
    $('.guess_input').val('').focus();
    return sock.emit('buzz', 'yay');
  });

  $('.pausebtn').click(function() {
    return removeSplash(function() {
      if (!!sync.time_freeze) {
        return sock.emit('unpause', 'yay');
      } else {
        return sock.emit('pause', 'yay');
      }
    });
  });

  $('.chat_input').keydown(function(e) {
    var _ref;
    if (((_ref = e.keyCode) === 47 || _ref === 111 || _ref === 191) && $(this).val().length === 0) {
      return e.preventDefault();
    }
  });

  $('input').keydown(function(e) {
    return e.stopPropagation();
  });

  $('.chat_input').keyup(function(e) {
    if (e.keyCode === 13) {
      return;
    }
    return sock.emit('chat', {
      text: $('.chat_input').val(),
      session: $('.chat_input').data('input_session'),
      done: false
    });
  });

  $('.chat_form').submit(function(e) {
    sock.emit('chat', {
      text: $('.chat_input').val(),
      session: $('.chat_input').data('input_session'),
      done: true
    });
    e.preventDefault();
    return setActionMode('');
  });

  $('.guess_input').keyup(function(e) {
    if (e.keyCode === 13) {
      return;
    }
    return sock.emit('guess', {
      text: $('.guess_input').val(),
      done: false
    });
  });

  $('.guess_form').submit(function(e) {
    sock.emit('guess', {
      text: $('.guess_input').val(),
      done: true
    });
    e.preventDefault();
    return setActionMode('');
  });

  $('.prompt_input').keyup(function(e) {
    if (e.keyCode === 13) {
      return;
    }
    return sock.emit('prompt', {
      text: $('.prompt_input').val(),
      done: false
    });
  });

  $('.prompt_form').submit(function(e) {
    sock.emit('prompt', {
      text: $('.prompt_input').val(),
      done: true
    });
    e.preventDefault();
    return setActionMode('');
  });

  $('body').keydown(function(e) {
    var _ref, _ref1, _ref2;
    if (actionMode === 'chat') {
      return $('.chat_input').focus();
    }
    if (actionMode === 'guess') {
      return $('.guess_input').focus();
    }
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      return;
    }
    if (e.keyCode === 32) {
      e.preventDefault();
      if ($('.bundle .start-page').length === 1) {
        return $('.pausebtn').click();
      } else {
        return $('.buzzbtn').click();
      }
    } else if ((_ref = e.keyCode) === 83 || _ref === 78 || _ref === 74) {
      return $('.skipbtn').click();
    } else if ((_ref1 = e.keyCode) === 80 || _ref1 === 82) {
      return $('.pausebtn').click();
    } else if ((_ref2 = e.keyCode) === 47 || _ref2 === 111 || _ref2 === 191 || _ref2 === 67) {
      e.preventDefault();
      return $('.chatbtn').click();
    }
  });

  $('.speed').change(function() {
    var rate;
    $('.speed').not(this).val($(this).val());
    rate = 1000 * 60 / 5 / Math.round($(this).val());
    return sock.emit('speed', rate);
  });

  $(window).resize(function() {
    return $('.expando').each(function() {
      var add, i, outer, size;
      add = sum((function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('.add-on');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push($(i).outerWidth());
        }
        return _results;
      }).call(this));
      size = $(this).width();
      outer = $(this).find('input').outerWidth() - $(this).find('input').width();
      return $(this).find('input').width(size - outer - add);
    });
  });

  $(window).resize();

  setTimeout(function() {
    return $(window).resize();
  }, 762);

  if (!Modernizr.touch && !mobileLayout()) {
    $('.actionbar button').tooltip();
    $('.actionbar button').click(function() {
      return $('.actionbar button').tooltip('hide');
    });
    $('#history, .settings').tooltip({
      selector: "[rel=tooltip]",
      placement: function() {
        if (mobileLayout()) {
          return "error";
        } else {
          return "left";
        }
      }
    });
  }

  if (Modernizr.touch) {
    $('.show-keyboard').hide();
    $('.show-touch').show();
  } else {
    $('.show-keyboard').show();
    $('.show-touch').hide();
  }

  handleCacheEvent = function() {
    var status;
    status = applicationCache.status;
    switch (applicationCache.status) {
      case applicationCache.UPDATEREADY:
        $('#cachestatus').text('Updated');
        console.log('update is ready');
        applicationCache.swapCache();
        $('#update').slideDown();
        if (localStorage.auto_reload === "yay") {
          return setTimeout(function() {
            return location.reload();
          }, 500);
        }
        break;
      case applicationCache.UNCACHED:
        return $('#cachestatus').text('Uncached');
      case applicationCache.OBSOLETE:
        return $('#cachestatus').text('Obsolete');
      case applicationCache.IDLE:
        return $('#cachestatus').text('Cached');
      case applicationCache.DOWNLOADING:
        return $('#cachestatus').text('Downloading');
      case applicationCache.CHECKING:
        return $('#cachestatus').text('Checking');
    }
  };

  (function() {
    var name, _i, _len, _ref, _results;
    if (window.applicationCache) {
      _ref = ['cached', 'checking', 'downloading', 'error', 'noupdate', 'obsolete', 'progress', 'updateready'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push(applicationCache.addEventListener(name, handleCacheEvent));
      }
      return _results;
    }
  })();

  setTimeout(function() {
    var deps, loadNextResource;
    window.exports = {};
    window.require = function() {
      return window.exports;
    };
    deps = ["html5slider", "levenshtein", "removeDiacritics", "answerparse", "syllable", "names", "offline"];
    loadNextResource = function() {
      return $.ajax({
        url: "../../public/javascripts/answer/" + (deps.shift()) + ".js",
        cache: true,
        dataType: "script",
        success: function() {
          if (deps.length > 0) {
            return loadNextResource();
          }
        }
      });
    };
    return loadNextResource();
  }, 10);

}).call(this);
