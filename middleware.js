
/*
 *  Generic require login routing middleware
 */

exports.assignUserName = function (req, res, next){
    if(req.loggedIn){
      if(req.session.auth.twitter){
        req.userName = req.session.auth.twitter.user.name;
        next();
      }else{
        req.userName = req.session.auth.facebook.user.name;
        next();
      }
    }else{
      req.userName = 'None';
      next();
    }
  };