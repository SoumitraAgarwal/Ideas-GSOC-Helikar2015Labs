ccNetViz = function(canvas, options) {
    options = options || {};
    options.styles = options.styles || {};

    var backgroundStyle = options.styles.background = options.styles.background || {};
    backgroundStyle.color = backgroundStyle.color || "rgb(255, 255, 255)";

    var nodeStyle = options.styles.node = options.styles.node || {};
    nodeStyle.minSize = nodeStyle.minSize != null ? nodeStyle.minSize : 6;
    nodeStyle.maxSize = nodeStyle.maxSize || 16;
    nodeStyle.color = nodeStyle.color || "rgb(255, 255, 255)";

    var edgeStyle = options.styles.edge = options.styles.edge || {};
    edgeStyle.width = edgeStyle.width || 2;
    edgeStyle.color = edgeStyle.color || "rgb(204, 204, 204)";

    var offset = 0.5 * nodeStyle.maxSize;

    for (var p in options.styles) {
        var s = options.styles[p];
        s.color && (s.color = new ccNetViz.color(s.color));
    }

    this.set = function(nodes, edges, layout) {
        nodes = nodes || [];
        edges = edges || [];
        layout = layout || "random";

        var created = !nodes.some(e => e.x == null || e.y == null);
        (created || (!created && new ccNetViz.layout[layout](nodes, edges).apply())) && ccNetViz.layout.normalize(nodes);

        scene.nodes.set(gl, nodes, options.styles, textures, (v, e, i) => {
            var x = e.x;
            var y = e.y;
            ccNetViz.primitive.quad(v.position, i, x, y, x, y, x, y, x, y);
            ccNetViz.primitive.quad(v.normal, i, -1, -1, 1, -1, 1, 1, -1, 1);
            ccNetViz.primitive.quad(v.textureCoord, i, 0, 0, 1, 0, 1, 1, 0, 1);
        });

        scene.edges.set(gl, edges, options.styles, textures, (v, e, i) => {
            var s = e.source;
            var t = e.target;

            ccNetViz.primitive.quad(v.position, i, s.x, s.y, s.x, s.y, t.x, t.y, t.x, t.y);

            var nx = t.y - s.y;
            var ny = s.x - t.x;
            var sc = 1 / Math.sqrt(nx*nx + ny*ny);
            nx *= sc;
            ny *= sc;

            ccNetViz.primitive.quad(v.normal, i, -nx, -ny, nx, ny, nx, ny, -nx, -ny);
        });
    }

    this.draw = function() {
        window.requestAnimationFrame(() => {
            var width = canvas.width;
            var height = canvas.height;

            gl.viewport(0, 0, width, height);

            var o = view.size === 1 ? offset : 0;
            var ox = o / width;
            var oy = o / height;
            var transform = ccNetViz.gl.ortho(view.x - ox, view.x + view.size + ox, view.y - oy, view.y + view.size + oy, -1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            scene.elements.forEach(e => e.draw(transform, width, height));
        });
    }

    this.resize = function() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    this.resetView = function() {
        view.size = 1;
        view.x = view.y = 0;
    }

    this.resize();

    var view = {};
    this.resetView();

    var gl = getContext();
    var textures = new ccNetViz.textures(this.draw);
    var scene = createScene.call(this);

    scene.add("edges", new ccNetViz.primitive(gl, edgeStyle, [
            "attribute vec2 position;",
            "attribute vec2 normal;",
            "uniform vec2 width;",
            "uniform mat4 transform;",
            "varying vec2 n;",
            "void main(void) {",
            "   gl_Position = vec4(width * normal, 0, 0) + transform * vec4(position, 0, 1);",
            "   n = normal;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "varying vec2 n;",
            "void main(void) {",
            "   gl_FragColor = vec4(color.r, color.g, color.b, color.a - length(n));",
            "}"
        ], c => {
            gl.uniform2f(c.shader.uniforms.width, c.style.width / c.width, c.style.width / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );
    scene.add("nodes", new ccNetViz.primitive(gl, nodeStyle, [
            "attribute vec2 position;",
            "attribute vec2 normal;",
            "attribute vec2 textureCoord;",
            "uniform vec2 size;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_Position = vec4(size * normal, 0, 0) + transform * vec4(position, 0, 1);",
            "   tc = textureCoord;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "uniform sampler2D texture;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_FragColor = color * texture2D(texture, vec2(tc.s, tc.t));",
            "}"
        ], c => {
            var size = Math.max(c.style.minSize, Math.min(c.style.maxSize, 0.2 * Math.sqrt(c.width * c.height / c.count) / view.size));
            gl.uniform2f(c.shader.uniforms.size, size / c.width, size / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );

    var bc = backgroundStyle.color;
    gl.clearColor(bc.r, bc.g, bc.b, bc.a);

    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    canvas.addEventListener("mousedown", onMouseDown.bind(this));
    canvas.addEventListener("wheel", onWheel.bind(this));

    function onWheel(e) {
        var rect = canvas.getBoundingClientRect();
        var size = Math.min(1.0, view.size * (1 + 0.001 * (e.deltaMode ? 33 : 1) * e.deltaY));
        var delta = size - view.size;

        view.size = size;
        view.x = Math.max(0, Math.min(1 - size, view.x - delta * (e.clientX - rect.left) / canvas.width));
        view.y = Math.max(0, Math.min(1 - size, view.y - delta * (1 - (e.clientY - rect.top) / canvas.height)));

        this.draw();
    }

    function onMouseDown(e) {
        var width = canvas.width / view.size;
        var height = canvas.height / view.size;
        var dx = view.x + e.clientX / width;
        var dy = e.clientY / height - view.y;

        var drag = e => {
            view.x = Math.max(0, Math.min(1 - view.size, dx - e.clientX / width));
            view.y = Math.max(0, Math.min(1 - view.size, e.clientY / height - dy));
            this.draw();
        };

        var up = () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', drag);
        };
        window.addEventListener('mouseup', up);
        window.addEventListener('mousemove', drag);

        e.preventDefault();
    }

    function getContext() {
        var attributes = { depth: false, antialias: false };
        return canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
    }

    function createScene() {
        return {
            elements: [],
            add: (name, e) => {
                scene[name] = e;
                scene.elements.push(e);
            }
        };
    }
}