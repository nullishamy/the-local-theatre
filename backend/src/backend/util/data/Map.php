<?php

namespace TLT\Util\Data;

use ArrayAccess;
use JsonSerializable;
use TLT\Util\ArrayUtil;
use TLT\Util\Log\Logger;

/**
 * A wrapper type surrounding PHP's standard associative array.
 * Provides extra functionality and safety features.
 */
class Map implements ArrayAccess, JsonSerializable {
	private $arr;
	private $frozen;

	private function __construct($arr = []) {
		$this->arr = $arr;
		$this->frozen = false;
	}

	public static function from($arr) {
		return new Map($arr);
	}

	public static function none() {
		return new Map([]);
	}

	public function values() {
		return array_values($this->raw());
	}

	public function raw() {
		return ArrayUtil::arrayCopy($this->arr);
	}

	function toAssocRecursive() {
		return $this->mapValuesRecursive(function ($item) {
			if ($item instanceof Map) {
				return $item->raw();
			}
			return $item;
		})->raw();
	}

	function mapValuesRecursive($mapper) {
		$func = function ($_, $value) use ($mapper) {
			return call_user_func($mapper, $value);
		};

		return $this->mapRecursive($func);
	}

	function mapRecursive($mapper) {
		$func = function ($key, $value) use (&$func, &$mapper) {
			$r = call_user_func($mapper, $key, $value);

			if ($r instanceof Map) {
				return new Map(ArrayUtil::arrayMapAssoc($func, $r->raw()));
			} elseif (is_array($r)) {
				return ArrayUtil::arrayMapAssoc($func, $r);
			}

			return $r;
		};

		return new Map(ArrayUtil::arrayMapAssoc($func, $this->arr));
	}

	function toMapRecursive() {
		return $this->mapValuesRecursive(function ($item) {
			if (is_array($item)) {
				return new Map($item);
			}
			return $item;
		});
	}

	function mapValues($mapper) {
		$func = function ($_, $value) use ($mapper) {
			return call_user_func($mapper, $value);
		};

		return $this->map($func);
	}

	function map($mapper) {
		$res = new Map();
		foreach ($this->arr as $key => $value) {
			$res[$key] = call_user_func($mapper, $key, $value);
		}
		return $res;
	}

	function filter($filter) {
		$res = new Map();
		foreach ($this->arr as $key => $value) {
			if (call_user_func($filter, $key, $value)) {
				$res[$key] = $value;
			}
		}
	}

	function first() {
		return $this[0];
	}

	function last() {
		return $this[$this->length() - 1];
	}

	function length() {
		return count($this->arr);
	}

	function isEmpty() {
		return $this->length() == 0;
	}

	public function orFalse($key) {
		return $this->orDefault($key, false);
	}

	public function orDefault($key, $default) {
		if (!$this->exists($key)) {
			return $default;
		}
		return $this->arr[$key];
	}

	public function exists($key) {
		return isset($this[$key]);
	}

	public function offsetSet($offset, $value) {
		$this->throwIfFrozen();

		if (is_null($offset)) {
			$this->arr[] = $value;
		} else {
			$this->arr[$offset] = $value;
		}
	}

	private function throwIfFrozen() {
		if ($this->frozen) {
			Logger::getInstance()->fatal(
				'Attempted to modify frozen map instance'
			);
		}
	}

	public function offsetExists($offset) {
		return isset($this->arr[$offset]);
	}

	public function offsetUnset($offset) {
		$this->throwIfFrozen();
		unset($this->arr[$offset]);
	}

	public function offsetGet($offset) {
		return isset($this->arr[$offset]) ? $this->arr[$offset] : null;
	}

	public function freeze() {
		$this->frozen = true;
		return $this;
	}

	public function isFrozen() {
		return $this->frozen;
	}

	public function toJSONString() {
		return json_encode($this->raw());
	}

	public function push($value) {
		$this->throwIfFrozen();
		array_push($this->arr, $value);
	}

	public function __toString() {
		$res = 'object(Map){';

		foreach ($this->arr as $key => $value) {
			$res .= "$key => $value,";
		}
		return $res . '}';
	}

	public function jsonSerialize() {
		return $this->raw();
	}
}
