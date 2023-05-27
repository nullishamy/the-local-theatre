import { useSelfUser } from '../../backend/hook/useSelfUser'
import { hasPermission, PermissionValue } from '../../model/Permission'
import { Redirect } from 'react-router'
import { Paths } from '../../util/paths'
import Separator from '../../component/Separator'
import { User } from '../../model/User'
import { useAPI } from '../../backend/hook/useAPI'
import { getBackend } from '../../backend/global-scope/util/getters'
import { ChangeEvent, useEffect, useState } from 'react'
import { createPlaceholders } from '../../util/factory'
import { Error, Warning } from '../../component/Factory'
import Modal from '../../component/Modal'
import { useReactiveCache, CacheUpdateFunction } from '../../util/cache'
import { EntityIdentifier } from '../../model/EntityIdentifier'

interface ModerationUserProps {
	user: User
	onDelete?: (oldUser: User) => void

}

type ModerationUserState = 'idle' | 'changing_permissions' | 'deletion'

interface ModalProps {
	onSubmit: (newValue: PermissionValue) => void
	onCancel: () => void
	state: ModerationUserState
}

function PermissionModal(props: ModerationUserProps & ModalProps) {
	const [level, setLevel] = useState(0)

	const handleSubmit = () => props.onSubmit(level)

	const handleChange = (event: ChangeEvent<HTMLSelectElement>) =>
		setLevel(parseInt(event.target.value))

	const handleCancel = () => props.onCancel()

	const shouldShow = () => props.state === 'changing_permissions'

	const component = () => (
		<div className="absolute flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 w-max h-auto top-0 right-5 z-10 rounded shadow-xl p-2">
			<h2 className="font-md text-gray-900 dark:text-gray-200">
				Editing {props.user.username}'s permissions
			</h2>
			<Separator className="w-4/5 my-3" />

			<select
				onChange={handleChange}
				className="text-sm p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
			>
				<option value="">--Set a permission level--</option>
				<option value={0}>View only</option>
				<option value={1}>Regular user</option>
				<option value={2}>Moderator</option>
			</select>

			<Separator className="w-2/5 my-3" />

			<button
				className="text-sm bg-gray-100 px-2 py-1 shadow-xl rounded"
				onClick={handleSubmit}
			>
				Done
			</button>
		</div>
	)

	return (
		<Modal
			provideMenu={component}
			onClickAway={handleCancel}
			shouldShow={shouldShow}
		/>
	)
}

function ModerationUser(props: ModerationUserProps) {
	const user = props.user
	const buttonStyles = (lightColour: string, darkColour: string) =>
		`block text-sm md:text-md bg-${lightColour} dark:bg-${darkColour}
         dark:text-gray-200 shadow-xl rounded p-2
    `

	const [state, setState] = useState<ModerationUserState>('idle')

	const handlePermissions = () => {
		setState('changing_permissions')
	}

	const handleDelete = () => {
		getBackend()
			.http.deleteUser(user.id)
			.then(() => setState('deletion'))
		props.onDelete?.(user)
	}

	const handleCancel = () => {
		setState('idle')
	}

	const handleSubmit = (perm: PermissionValue) => {
		getBackend().http.updateUser({
			...user,
			permissions: perm,
		})
		setState('idle')
	}

	if (state === 'deletion') {
		return <> </>
	}

	return (
		<div className="w-auto bg-gray-100 dark:bg-gray-500 shadow rounded m-2 p-2">
			<div className="grid grid-rows-1 grid-cols-3 md:grid-cols-5 gap-4 place-items-center justify-center">
				<p className="md:col-span-3 place-self-start font-semibold dark:text-gray-100">
					{user.firstName} {user.lastName} ({user.username})
				</p>

				<button
					onClick={handleDelete}
					className={buttonStyles('red-300', 'red-700')}
				>
					Delete
				</button>

				<div className="relative">
					<PermissionModal
						user={user}
						state={state}
						onSubmit={handleSubmit}
						onCancel={handleCancel}
					/>
					<button
						onClick={handlePermissions}
						className={buttonStyles('blue-100', 'blue-800')}
					>
						Permissions
					</button>
				</div>
			</div>
		</div>
	)
}

function UserList() {
	const [isError, setError] = useState(false)
	const [users, updateCache] = useReactiveCache<EntityIdentifier, User>()
	const selfUser = useSelfUser()

	useEffect(() => {
		getBackend()
			.http.loadUsers()
			.then((newUsers) => {
				newUsers.forEach((u) => users.set(u.id, u))
				updateCache()
			})
			.catch(() => setError(true))
	}, [])

	const UserPlaceholders = () =>
		createPlaceholders((i) => (
			<div
				key={i}
				className="w-auto bg-gray-100 dark:bg-gray-500 shadow-xl rounded m-2 p-2"
			>
				<div className="w-1/3 h-3 bg-gray-300 animate-pulse rounded-xl m-2 mb-4" />

				<div className="w-2/5 h-2 bg-gray-300 animate-pulse rounded-xl m-2" />
				<div className="w-2/5 h-2 bg-gray-300 animate-pulse rounded-xl m-2" />
			</div>
		))

	if (isError) {
		return <Error>An error occured</Error>
	}
	if (!users || !selfUser) {
		return <>{UserPlaceholders()}</>
	}

	const filtered = users.values().filter((u) => u.id !== selfUser.id)

	if (!filtered.length) {
		return (
			<div className="w-auto bg-gray-100 dark:bg-gray-500 shadow-xl rounded m-2 p-2 flex flex-col items-center">
				<Warning>No users found</Warning>
			</div>
		)
	}
	return (
		<ul>
			{filtered.map((u) => (
				<ModerationUser
					onDelete={(d) => {
						users.delete(d.id)
						updateCache()
					}}
					key={u.id}
					user={u}
				/>
			))}
		</ul>
	)
}

export default function Moderation() {
	const selfUser = useSelfUser()

	if (!selfUser || !hasPermission(selfUser.permissions, 'moderator')) {
		return <Redirect to={Paths.HOME} />
	}

	return (
		<div className="w-auto h-auto m-4 p-2 bg-gray-200 dark:bg-gray-500 rounded shadow-xl">
			<div className="w-max">
				<h2 className="pt-2 px-2 font-semibold text-lg dark:text-gray-100">
					Moderation
				</h2>
				<Separator className="mx-2" />
			</div>

			<UserList />
		</div>
	)
}
