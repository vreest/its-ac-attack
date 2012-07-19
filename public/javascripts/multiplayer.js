var socket = io.connect();
var aUser = document.getElementById("userName").value;
var questNum = document.getElementById("questionNumber").value;
var reading;


socket.on('connect', function () {
  $('#chat').addClass('connected');
  $('#connecting').addClass('hide');
  socket.emit('user', aUser);
  clear();
  $('#chat').addClass('nickname-set');
});

socket.on('currentQuestion', function(data){
  var q = data[0];
  var words = q.question.split(" ");
  var pointer = 0;
  $("#year").text(q.year);
  $("#difficulty").text(q.difficulty);
  $("#category").text(q.category);
  $("#tournament").text(q.tournament);
  $("#answer").text(q.answer);
  function nextWord(){
    $("#question").text(words.slice(0, ++pointer).join(" "));
    $("<span>").css("visibility", "hidden").text(words.slice(pointer).join(" ")).appendTo("#question");
    reading = setTimeout(nextWord, 1000*60/500);
  }
  nextWord();
});

socket.on('answerResult', function(data){
  $(document).ready(function(){
    if(data){
      $('#answer').text('Your answer is correct!');
      $("#question").text(data[0].question);
    }else{
      $('#answer').text('Your answer is incorrect =(');
      nextWord();
    }
  });
});

socket.on('start', function(data){
    $('#start').addClass("hide");
    $('#information').removeClass("hide");
    $("#buzzer").removeClass("hide");
    $("#skip").removeClass("hide");
});

socket.on('lockout', function(data){
  clearTimeout(reading);
});

socket.on('theBuzzer', function(data){
    clearTimeout(reading);
    $("#answerDiv").removeClass("hide");
    $('#skip').addClass("hide");
    $("#buzzer").addClass("hide");
});

// General Announcements
socket.on('announcement', function (msg) {
  $('#lines').append($('<p>').append($('<em>').text(" " + msg + " ")));
});

//
socket.on('names', function (names) {
  $('#nicknames').empty().append($('<span>Online: </span>'));
  for (var i in names) {
    $('#nicknames').append($('<b>').text(" " + names[i] + " "));
  }
});

socket.on('user message', message);
socket.on('reconnect', function () {
  $('#lines').remove();
  message('System', 'Reconnected to the server');
});

socket.on('reconnecting', function () {
  message('System', 'Attempting to re-connect to the server');
});

socket.on('error', function (e) {
  message('System', e ? e : 'A unknown error occurred');
});

$(document).ready(function(){
  // Send messages
  $('#send-message').submit(function () {
    message('me', $('#message').val());
    socket.emit('user message', $('#message').val());
    clear();
    $('#lines').get(0).scrollTop = 10000000;
    return false;
  });

  // Submitting Answers
  $('#answerForm').submit(function(event){
    event.preventDefault();
    socket.emit('answer', $('#answerInput').val());
    $('#answerDiv').addClass("hide");
    $('#nextQuestionButton').removeClass("hide");
  });

  // Buzzer
  $("#buzzer").click(function(event){
    socket.emit('buzzed', aUser);
  });

  // Start the question
  $('#start').click(function(event){
    socket.emit('question', questNum);
  });
});



function message (from, msg) {
  if(msg.length > 0){
    $('#lines').append($('<p>').append($('<b>').text(from + ": "), msg));
  }
}

function clear () {
    $('#message').val('').focus();
}

