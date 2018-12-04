'use strict'

const Database = use('Database')
const Post = use('App/Models/Post')
const User = use('App/models/User')
const Tag = use('App/models/Tag')
const Route = use('Route')
const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt()
const md5 = require('js-md5')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with posts
 */
class PostController {
	/**
   * Show a list of all posts.
   * GET posts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async index ({ request, response, view }) {
		const page = request.input('page')
		const perPage = 6
		const posts = await Post.query()
			.orderBy('updated_at', 'desc')
			.with('user', (builder) => {
				builder.select('id', 'username')
			})
			.with('user.profile')
      .paginate(page, perPage)

    return view.render('post.index', { ...posts.toJSON() })
	}

	/**
   * Render a form to be used for creating a new post.
   * GET posts/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async create ({ request, response, view, auth }) {
    const userPhoto = `https://cn.gravatar.com/avatar/${md5(auth.user.email)}?s=60&d=robohash&r=G`
    const userId = auth.user.toJSON().id
		const userItems = [
			{
				...auth.user.toJSON(),
				check : true
			}
		]

		// const users = await User.all()
		const tags = await Tag.all()
    console.log(userId)
		return view.render('post.create', {
      users : userItems,
      userPhoto,
      userId,
			tags  : tags.toJSON()
		})
	}

	/**
   * Create/save a new post.
   * POST posts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async store ({ request, response, session, auth }) {
    const newPost = request.only([ 'title', 'content' ])
    const { content } = newPost
    const md_content = md.render(content)
    newPost.md_content = md_content
		const tags = request.input('tags')
		// const postId = await Database.insert(newPost).into('posts')
		// console.log(postId)
		// const post = await Post.create(newPost)

    // const user = await User.find(request.input('user_id'))

		const post = await auth.user.posts().create(newPost)
		await post.tags().attach(tags)

		return response.route('posts.show', { id: post.id })
	}

	/**
   * Display a single post.
   * GET posts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async show ({ params, request, response, view }) {
		// const post = await Database.from('posts')
		//   .where('id', params.id)
		//   .first()

		const post = await Post.findOrFail(params.id)
		const tags = await post.tags().select('id', 'title').fetch()

		return view.render('post.show', { post, tags: tags.toJSON() })
	}

	/**
   * Render a form to update an existing post.
   * GET posts/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async edit ({ params, request, response, view, auth }) {
		// const post = await Database.from('posts')
		//   .where('id', params.id)
		//   .first()

		const _post = await Post.findOrFail(params.id)
		const users = await User.all()
		const _tags = await Tag.all()
		const tags = _tags.toJSON()
		await _post.loadMany([ 'tags', 'user' ])
		const post = _post.toJSON()
    const postTagIds = post.tags.map((tag) => tag.id)
    const userPhoto = `https://cn.gravatar.com/avatar/${ md5(auth.user.email) }?s=60&d=robohash&r=G`

		const tagItems = tags.map((tag) => {
			if (postTagIds.includes(tag.id)) {
				tag.check = true
			}

			return tag
		})

		let userItems = []

		userItems = [
			{
				...post.user,
				check : true
			}
		]

		if (auth.user.id === 2) {
			userItems = users.toJSON().map((user) => {
				if (user.id === post.user_id) {
					user.check = true
				}

				return user
			})
    }

    const userId = auth.user.id

		return view.render('post.edit', {
			post  : post,
      users : userItems,
      tags  : tagItems,
      userPhoto,
      userId
		})
	}

	/**
   * Update post details.
   * PUT or PATCH posts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async update ({ params, request, response, session, auth }) {
		const { title, content, user_id, tags } = request.all()

		const md_content = md.render(content)

		// const updatedPost = request.only([ 'title', 'content' ])
		// await Database.table('posts')
		//   .where('id', params.id)
		//   .update(updatedPost)

		const post = await Post.findOrFail(params.id)
		post.merge({ title, content, md_content })
		await post.save()

		if (auth.user.id === 2) {
			const user = await User.find(user_id)
			await post.user().associate(user)
		}

		await post.tags().sync(tags)

		session.flash({
			type    : 'primary',
      message: 'Post updated successfully.'
		})

		return response.redirect(
			Route.url('PostController.show', {
				id : post.id
			})
		)
	}

	/**
   * Delete a post with id.
   * DELETE posts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async destroy ({ params, request, response }) {
		// await Database.table('posts')
		//   .where('id', params.id)
		//   .delete()

		const post = await Post.find(params.id)
		try {
			await post.tags().detach()
			post.delete()
		} catch (error) {
			console.log(error)
		}
		return 'success'
	}
}

module.exports = PostController
