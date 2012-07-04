var Question = mongoose.model('Question')
  , questions = []
  , searchIndx;

function getJson(searchIndx){
	Question.find({$or :                                // $or is similar to logic OR also RegEx allows for partial searchs
		[{category: {$regex: searchIndx}}               // Searches by Categories
		, {answer:{$regex: searchIndx}}                 // Searches by Answers
		, {difficulty:{$regex: searchIndx}}             // Searches by Difficulty
		, {year: searchIndx}]}, function(err, items){   // Searches by Year
      questions = items;
      console.log("Error "+ err);
    });
}

module.exports = function(app){
  app.get('/search', function(req, res){
    getJson(2011);
    res.render('questions/search', {
      title: 'Search',
      questions: questions
    });
  });
};
