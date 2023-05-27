<?php

namespace TLT\Routing;

use TLT\Routing\Impl\AvatarRoute;
use TLT\Routing\Impl\CommentListRoute;
use TLT\Routing\Impl\CommentRoute;
use TLT\Routing\Impl\DefaultRoute;
use TLT\Routing\Impl\LoginRoute;
use TLT\Routing\Impl\ModerationRoute;
use TLT\Routing\Impl\PostListRoute;
use TLT\Routing\Impl\PostRoute;
use TLT\Routing\Impl\SelfUserRoute;
use TLT\Routing\Impl\ShowImageRoute;
use TLT\Routing\Impl\ShowListRoute;
use TLT\Routing\Impl\SignupRoute;
use TLT\Routing\Impl\UserListRoute;
use TLT\Routing\Impl\UserRoute;

/**
 * A router for all the API Routes
 * @see BaseRoute
 */
class Router {
	private $routes;

	public function __construct() {
		$this->routes = [
			new AvatarRoute(),
			new DefaultRoute(),
			new CommentListRoute(),
			new CommentRoute(),
			new LoginRoute(),
			new ModerationRoute(),
			new PostListRoute(),
			new PostRoute(),
			new SelfUserRoute(),
			new ShowImageRoute(),
			new ShowListRoute(),
			new SignupRoute(),
			new UserListRoute(),
			new UserRoute(),
		];
	}

	/**
	 * Gets the routing for a given path.
	 *
	 * @param string[] $parts the path
	 * @return  BaseRoute       returns false if a route is not found
	 */
	public function getRouteForPath($parts) {
		$match = join('/', $parts);

		foreach ($this->routes as $route) {
			if ($route->path == $match) {
				return $route;
			}
		}
		return null;
	}
}
