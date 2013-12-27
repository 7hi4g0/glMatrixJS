describe("GLMatrix", function () {
	it("should work with or without new", function () {
		var m1,
			m2;
			
		m1 = new GLMatrix();
		m2 = GLMatrix();

		expect(m1 instanceof GLMatrix).toBe(true);
		expect(m2 instanceof GLMatrix).toBe(true);
	});
});