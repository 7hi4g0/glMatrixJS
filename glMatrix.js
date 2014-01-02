/*export GLMatrix*/

var GLMatrix;

(function () {
	"use strict";

	var degreeToRadian;

	GLMatrix = function (dimension) {
		if (!(this instanceof GLMatrix)) {
			return new GLMatrix(arguments);
		}

		this.dimension = dimension || 4;
		this.size = dimension * dimension;

		this.elements = [];

		this.empty();
	};

	GLMatrix.identity = function (dimension) {
		var mat,
			index;

		mat = new GLMatrix(dimension);

		for (index = 0; index < dimension; index += 1) {
			mat.set(index, index, 1);
		}

		return mat;
	};

	GLMatrix.orthographic = function (xLeft, xRight, yDown, yUp, zNear, zFar) {
		var mat;

		mat = new GLMatrix(4);

		mat.setOrthographic(xLeft, xRight, yDown, yUp, zNear, zFar);

		return mat;
	};

	GLMatrix.frustum = function (xLeft, xRight, yDown, yUp, zNear, zFar) {
		var mat;

		mat = new GLMatrix(4);

		mat.setFrustum(xLeft, xRight, yDown, yUp, zNear, zFar);

		return mat;
	};

	GLMatrix.perspective = function (angle, aspectRatio, zNear, zFar) {
		var mat;

		mat = new GLMatrix(4);

		mat.setPerspective(angle, aspectRatio, zNear, zFar);

		return mat;
	};

	GLMatrix.prototype = {
		get: function (row, col) {
			return this.elements[col * this.dimension + row];
		},
		set: function (row, col, value) {
			this.elements[col * this.dimension + row] = value;
			return this;
		},
		add: function (right) {
			var index,
				result;

			if (this.size !== right.size) {
				throw new Error("Different matrices size");
			}

			result = new GLMatrix(this.dimension);

			for (index = 0; index < this.size; index += 1) {
				result.elements[index] = this.elements[index] + right.elements[index];
			}

			return result;
		},
		mul: function (right) {
			var index,
				rightCol,
				row,
				col,
				result;

			result = new GLMatrix(this.dimension);

			if (right instanceof GLMatrix) {
				if (this.size !== right.size) {
					throw new Error("Different matrices size");
				}

				for (rightCol = 0; rightCol < this.dimension; rightCol += 1) {
					for (row = 0; row < this.dimension; row += 1) {
						for (col = 0; col < this.dimension; col += 1) {
							result.set(row, rightCol,
								result.get(row, rightCol) +
								this.get(row, col) * right.get(col, rightCol));
						}
					}
				}
			} else if (typeof right === "number") {
				for (index = 0; index < this.size; index += 1) {
					result.elements[index] = this.elements[index] * right;
				}
			} else {
				throw new Error("Invalid parameter type");
			}

			return result;
		},
		empty: function () {
			var index;

			for (index = 0; index < this.size; index += 1) {
				this.elements[index] = 0;
			}

			return this;
		},
		identity: function () {
			var index;

			this.empty();

			for (index = 0; index < this.dimension; index += 1) {
				this.set(index, index, 1);
			}

			return this;
		},
		translate: function (xAxis, yAxis, zAxis) {
			var transform;

			if (this.dimension < 4) {
				throw new Error("Wrong matrix dimension");
			}

			transform = GLMatrix.identity(this.dimension);

			transform
				.set(0, 3, xAxis)
				.set(1, 3, yAxis)
				.set(2, 3, zAxis);

			this.elements = transform.mul(this).elements;

			return this;
		},
		scale: function (xAxis, yAxis, zAxis) {
			var transform;

			if (this.dimension < 3) {
				throw new Error("Wrong matrix dimension");
			}

			transform = GLMatrix.identity(this.dimension);

			transform
				.set(0, 0, xAxis)
				.set(1, 1, yAxis)
				.set(2, 2, zAxis);

			this.elements = transform.mul(this).elements;

			return this;
		},
		rotate: function (angle, xAxis, yAxis, zAxis) {
			var magnitude,
				axis,
				cosine,
				sine;

			if (this.dimension < 3) {
				throw new Error("Wrong matrix dimension");
			}

			// Normalize vector
			magnitude = Math.sqrt(xAxis * xAxis + yAxis * yAxis + zAxis * zAxis);

			xAxis /= magnitude;
			yAxis /= magnitude;
			zAxis /= magnitude;

			// Transform angle so we can use Math functions
			angle = degreeToRadian(angle);

			cosine = Math.cos(angle);
			sine = Math.sin(angle);

			axis = new GLMatrix(this.dimension);

			axis
				.set(0, 1, -zAxis)
				.set(0, 2, yAxis)
				.set(1, 2, -xAxis)

				.set(1, 0, zAxis)
				.set(2, 0, -yAxis)
				.set(2, 1, xAxis);

			this.elements = (GLMatrix.identity(this.dimension)
								.add(axis.mul(sine))
								.add(axis.mul(axis).mul(1 - cosine))
								.mul(this)).elements;

			return this;
		},
		setOrthographic: function (xLeft, xRight, yDown, yUp, zNear, zFar) {
			var xHalf,
				yHalf,
				zHalf;

			if (this.dimension < 4) {
				throw new Error("Wrong matrix dimension");
			}

			xHalf = (xRight - xLeft) / 2;
			yHalf = (yUp - yDown) / 2;
			zHalf = (zFar - zNear) / 2;

			this
				.identity()

				.set(0, 0, 1 / xHalf)
				.set(1, 1, 1 / yHalf)
				.set(2, 2, 1 / zHalf)

				.set(0, 3, -xLeft / xHalf - 1.0)
				.set(1, 3, -yDown / yHalf - 1.0)
				.set(2, 3, -zNear / zHalf - 1.0);

			return this;
		},
		setFrustum: function (xLeft, xRight, yDown, yUp, zNear, zFar) {
			var xHalf,
				yHalf,
				zHalf;

			if (this.dimension < 4) {
				throw new Error("Wrong matrix dimension");
			}

			xHalf = (xRight - xLeft) / 2.0;
			yHalf = (yUp - yDown) / 2.0;
			zHalf = (zFar - zNear) / 2.0;

			// WHY ???????????
			this
				.empty()

				.set(0, 0, zNear / xHalf)
				.set(1, 1, zNear / yHalf)

				.set(0, 2, -xLeft / xHalf - 1.0)
				.set(1, 2, -yDown / yHalf - 1.0)
				.set(2, 2, zNear / zHalf + 1.0)

				.set(2, 3, -(zNear * zFar / zHalf))

				.set(3, 2, 1.0)
				.set(3, 3, 0.0);

			return this;
		},
		setPerspective: function (angle, aspectRatio, zNear, zFar) {
			var yUp,
				yDown,
				xLeft,
				xRight;

			angle = degreeToRadian(angle);

			yUp = zNear * Math.tan(angle / 2.0);
			yDown = -yUp;
			xLeft = yDown * aspectRatio;
			xRight = -xLeft;

			this.setFrustum(xLeft, xRight, yDown, yUp, zNear, zFar);

			return this;
		}
	};

	degreeToRadian = function (angle) {
		return angle * Math.PI / 180.0;
	};
}());