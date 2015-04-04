ccNetViz.primitive = function(gl, parent, vs, fs, bind) {
    var shader = new ccNetViz.shader(gl, vs.join('\n'), fs.join('\n'));
    var buffers = [];
    var sections = [];
    var count = 0;

    this.set = (gl, data, styles, textures, action) => {
        count = data.length;
        var perStyle = {};
        for (var i = 0; i < count; i++) {
            var e = data[i];
            var s = perStyle[e.style] = perStyle[e.style] || [];
            s.push(e);
        }

        var max = 2*65536;
        var nv, ni, j, k, si = 0, bi = 0;
        var e = {};

        var init = section => {
            j = k = 0;
            nv = Math.min(max, 8*section.length - (bi - si)*max);
            ni = 6*nv/8;

            if (!e.indices || e.indices.length !== ni) {
                e.indices = new Uint16Array(ni);
                for (var a in shader.attributes) e[a] = new Float32Array(nv);
            }
        };

        var store = section => {
            var b = buffers[bi];
            if (!b) {
                buffers[bi] = b = {};
                for (var a in e) b[a] = gl.createBuffer();
            }
            for (var a in shader.attributes) {
                gl.bindBuffer(gl.ARRAY_BUFFER, b[a]);
                gl.bufferData(gl.ARRAY_BUFFER, e[a], gl.STATIC_DRAW);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.indices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, e.indices, gl.STATIC_DRAW);
            b.count = ni;
            section.buffers.push(b);
            bi++;
        };

        var createStyle = (parent, child) => {
            var result = {};

            for (var p in parent) result[p] = parent[p];

            if (child) {
                for (var p in child) result[p] = child[p];
            }
            return result;
        };

        sections = [];
        for (var p in perStyle) {
            si = bi;

            var section = {
                style: createStyle(parent, styles[p]),
                buffers: []
            };

            var s = perStyle[p];
            init(s);
            for (var i = 0; i < s.length; i++, j += 8) {
                if (j + 8 > max) {
                    store(section);
                    init(s);
                }
                var q = j / 2;
                e.indices[k++] = q;
                e.indices[k++] = q + 1;
                e.indices[k++] = q + 2;
                e.indices[k++] = q + 2;
                e.indices[k++] = q + 3;
                e.indices[k++] = q;

                action(e, s[i], j);
            }
            store(section);

            function add() {
                sections.push(this);
            }
            var addSection = add.bind(section);

            section.style.texture ? section.style.texture = textures.get(gl, section.style.texture, addSection) : addSection();
        }
    }

    this.draw = (transform, width, height) => {
        var context = {
            shader: shader,
            count: count,
            width: width,
            height: height
        }

        shader.bind();

        gl.uniformMatrix4fv(shader.uniforms.transform, false, transform);

        sections.forEach(section => {
            if (section.style.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, section.style.texture);
                gl.uniform1i(shader.uniforms.texture, 0);
            }

            context.style = section.style;
            bind(context);

            section.buffers.forEach(e => {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e.indices);

                for (var a in shader.attributes) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, e[a]);
                    gl.vertexAttribPointer(shader.attributes[a], 2, gl.FLOAT, false, 0, 0);
                }

                gl.drawElements(gl.TRIANGLES, e.count, gl.UNSIGNED_SHORT, 0);
            });
        });

        shader.unbind();
    }
}

ccNetViz.primitive.quad = function(buffer, i, x1, y1, x2, y2, x3, y3, x4, y4) {
    buffer[i++] = x1;
    buffer[i++] = y1;
    buffer[i++] = x2;
    buffer[i++] = y2;
    buffer[i++] = x3;
    buffer[i++] = y3;
    buffer[i++] = x4;
    buffer[i++] = y4;
}