<?php

namespace TLT\Routing\Impl;

use TLT\Routing\BaseRoute;
use TLT\Util\Assert\Assertions;
use TLT\Util\Data\DataUtil;
use TLT\Util\Enum\ContentType;
use TLT\Util\Enum\CORS;
use TLT\Util\Enum\RequestMethod;
use TLT\Util\Enum\StatusCode;
use TLT\Util\HttpResult;

class ShowImageRoute extends BaseRoute {
	public function __construct() {
		parent::__construct('show/image', [RequestMethod::GET]);
	}

	public function handle($sess, $res) {
		$id = $sess->queryParams()['id'];

		Assertions::assertSet($id);

		$res->content('png')
			->cors('all')
			->status(200)
			->data("shows/$id.png", 'shows/show.png');
	}

	public function validate($sess, $res) {
		if (!isset($sess->queryParams()['id'])) {
			return HttpResult::BadRequest('No ID provided.');
		}
		return HttpResult::Ok();
	}
}
