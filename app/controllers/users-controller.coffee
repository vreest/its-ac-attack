User = mongoose.model("User")
mid = require("../../middleware.coffee")

module.exports = (app) ->
  app.get "/signup", (req, res) ->
    res.render "users/signup", {
      title: "Sign Up"
    }
    
  app.get "/notAuthorized", (req, res) ->
    res.render "users/notAuthorized", { 
      title: "You are not Authorized"
    }

  app.get "/settings", mid.userInformation, (req, res) ->
    res.render "users/settings"

  app.get "/profile", mid.userInformation, (req, res) ->
    if req.loggedIn
      res.render "users/profile", {
        title: "Profile"
        loggedIn: req.loggedIn
        user: req.userInfo
        userName: req.userName
      }
    else
      res.redirect '/notAuthorized'

  app.get "/logout", (req, res) ->
    req.logout()
    res.redirect "/home"
