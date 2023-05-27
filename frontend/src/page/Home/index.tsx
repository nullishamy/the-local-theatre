import { logger } from '../../util/log'
import { Post } from '../../model/Post'
import { useAPI } from '../../backend/hook/useAPI'
import { Link } from 'react-router-dom'
import React, { useState } from 'react'
import Separator from '../../component/Separator'
import { toDate } from '../../util/time'
import { User } from '../../model/User'
import { Show } from '../../model/Show'
import { ManagerController } from '../../backend/manager/ManagerController'
import { getBackend } from '../../backend/global-scope/util/getters'
import { toURL } from '../../backend/request/mappers'
import { createPlaceholders } from '../../util/factory'
import { Error, Warning } from '../../component/Factory'

const HOME_PAGE_POST_COUNT = 10

async function getPost(backend: ManagerController): Promise<Post[]> {
	const posts = await backend.http.loadAllPosts()
	if (posts) {
		logger.debug('Received valid post ' + JSON.stringify(posts))
		return posts.slice(0, HOME_PAGE_POST_COUNT)
	} else {
		logger.debug('No posts received')
		throw new TypeError('No posts received')
	}
}

interface ActivityProps {
	author: User
	message: JSX.Element
	timeCreated: Date
	backend: ManagerController
	linkTo: string
}

function PostPlaceholders() {
	return createPlaceholders(
		(i) => (
			<div
				key={i}
				className="flex animate-pulse items-center bg-gray-200 dark:bg-gray-500 m-2 shadow-xl rounded-xl"
			>
				<div className="w-12 h-12 m-2 bg-gray-200 dark:bg-gray-400 rounded" />

				<div className="w-full h-full animate-pulse">
					<div className="w-auto h-4 m-2 bg-gray-200 dark:bg-gray-400 rounded" />
					<div className="w-auto h-4 m-2 bg-gray-200 dark:bg-gray-400 rounded" />
				</div>
			</div>
		),
		6
	)
}

function Activity(props: ActivityProps) {
	const activityElementStyles = `
    m-4 text-md text-gray-900 dark:text-gray-200
    `

	const avatar = useAPI(() =>
		props.backend.http.loadAvatar(props.author).map(toURL)
	)

	const formatDate = (d: Date): string => {
		return `on ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} at
    ${d.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: 'numeric',
	})}
    `
	}

	return (
		<Link to={props.linkTo}>
			<div className="transition duration-300 ease-in-out transform hover:-translate-y-1 hover:bg-gray-100 dark:hover:bg-gray-400 flex items-center bg-gray-200 dark:bg-gray-500 m-2 shadow-xl rounded-xl">
				{!avatar ? (
					// avatar hasn't loaded yet
					<div className="w-12 h-12 m-2 bg-gray-200 dark:bg-gray-400 rounded" />
				) : (
					// avatar has loaded, display it
					<img
						className="w-12 h-12 m-2 ml-5"
						src={avatar}
						alt="User avatar"
					/>
				)}
				<div className={activityElementStyles}>
					{props.message}
					<br />
					<p className="text-sm text-gray-500 dark:text-gray-300">
						{formatDate(props.timeCreated)}
					</p>
				</div>
			</div>
		</Link>
	)
}

function LatestShows() {
	const backend = getBackend()
	const [isError, setIsError] = useState(false)
	const shows = useAPI(
		() => backend.http.loadShows(),
		() => setIsError(true)
	)

	const ShowElement = (showProps: { model: Show }) => {
		const [isInnerError, setIsInnerError] = useState(false)

		const img = useAPI(
			() => backend.http.loadShowImage(showProps.model).map(toURL),
			() => setIsInnerError(true)
		)

		if (isInnerError) {
			return <>{<Error>An error occurred</Error>}</>
		}

		const showDate = toDate(showProps.model.showDate)
		return (
			<figure
				className="w-full h-full bg-gray-200 dark:bg-gray-500 p-4 shadow-xl rounded-xl flex flex-col place-items-center
                transition duration-300 ease-in-out transform  hover:scale-105 tabbable"
			>
				<img
					className="h-2/3 w-1/3 pb-4 flex-grow"
					src={img}
					alt={`Advertisement of ${showProps.model.title}`}
				/>

				<Separator className="pt-4 w-2/3" />
				<figcaption className="text-bold text-xl text-gray-900 dark:text-gray-100 text-center">
					{showProps.model.title}
				</figcaption>
				<p className="text-gray-900 dark:text-gray-100 text-sm">
					Showing on
					<time dateTime={showDate.toUTCString()}>
						{' '}
						{showDate.toLocaleDateString()}
					</time>
				</p>
			</figure>
		)
	}

	if (isError) {
		return <>{<Error>An error occurred</Error>}</>
	}

	return (
		<ul className="grid grid-cols-1 gap-4 p-4 grid-flow-row auto-rows-max md:grid-cols-2 items-center">
			{shows
				? shows.map((show) => (
						<ShowElement key={show.id} model={show} />
				  ))
				: PostPlaceholders()}
		</ul>
	)
}

function RecentActivity() {
	const [isError, setIsError] = useState(false)
	const backend = getBackend()
	const posts = useAPI(
		() => getPost(backend),
		() => setIsError(true)
	)

	if (isError) {
		return <>{<Error>An error occurred</Error>}</>
	}
	if (!posts) {
		return <>{PostPlaceholders()}</>
	}

	if (!posts.length) {
		return (
			<div className="flex flex-col items-center bg-gray-200 dark:bg-gray-500 w-auto m-2 shadow-xl rounded-xl">
				<Warning>No posts found</Warning>
			</div>
		)
	}

	const earliestFirst = [...posts]
		.sort((a, b) => b.createdAt - a.createdAt)
		.slice(0, 5)

	return (
		<>
			{earliestFirst.map((post, idx) => (
				<Activity
					key={idx}
					backend={backend}
					author={post.author}
					linkTo={`/~20006203/post/${post.id}`}
					message={
						<>
							<b>
								{post.author.firstName} {post.author.lastName}
							</b>{' '}
							created 1 new post <b>{post.title}</b>
						</>
					}
					timeCreated={toDate(post.createdAt)}
				/>
			))}
		</>
	)
}

export default function Home() {
	logger.debug('Rendering home page')

	return (
		<div className="md:flex flex-col md:flex-row w-auto">
			<div className="w-auto md:w-2/5 h-full overflow-scroll md:overflow-visible bg-gray-300 dark:bg-gray-500 m-2 p-2 shadow-xl rounded">
				{/* Recent activity pane  */}
				<section>
					<h2 className="text-xl font-semibold p-2 text-gray-900 dark:text-gray-200">
						Recent Activity
					</h2>
					<Separator className="mx-2" />

					<ul className="grid grid-cols-1 grid-flow-row auto-rows-max items-baseline">
						<RecentActivity />
					</ul>
				</section>
			</div>

			<div className="w-auto md:w-2/3 h-full overflow-scroll md:overflow-visible bg-gray-300 dark:bg-gray-500 m-2 p-2 shadow-xl rounded">
				{/* Latest shows pane  */}
				<section>
					<h2 className="text-xl font-semibold p-2 text-gray-900 dark:text-gray-200">
						Latest shows
					</h2>
					<Separator className="mx-2" />

					<LatestShows />
				</section>
			</div>
		</div>
	)
}
