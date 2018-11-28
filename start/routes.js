'use strict'

const Route = use('Route')
const Profile = use('App/Models/Profile')

Route.on('/').render('welcome')

Route.get('register', 'UserController.create')
  .as('signUp')

Route.get('users/create', ({ response }) => response.route('signUp'))

Route.resource('/posts', 'PostController')

Route.resource('/users', 'UserController')

Route.resource('/tags', 'TagController')

Route.get('profiles/:id', async ({ params }) => {
  const profile = await Profile.find(params.id)
  const user = await profile.user()
    .select('username')
    .fetch()

  return {
    profile,
    user
  }
})
