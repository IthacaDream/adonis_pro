'use strict'

class PostController {
  index({ view }) {
    const pageTitle = 'List of Posts'
    const user = {
      name: 'lishaoy'
    }
    const entities = [
      { id: 0 ,title: 'Lemon', content: '🍋' },
      { id: 1 ,title: 'Banana', content: '🍌' },
      { id: 2 ,title: 'Watermelon', content: '🍉' }
    ]
    return view.render('posts.index', { pageTitle, user,  entities})
  }
}

module.exports = PostController
