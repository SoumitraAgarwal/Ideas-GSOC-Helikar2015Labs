var shortestPath=function()
{
	var geometry = new THREE.Geometry();
	var hollowSphere=new THREE.sphere(material);
	var sphereGeometry = new THREE.SphereGeometry(0, 0, 0);
	var sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
 	// position the sphere
    sphere.position.x = node1.X;
    sphere.position.y = node1.Y;
    sphere.position.z = mode1.Z;
    geometry.vertices.push( node1.position );
    var max=Math.pow((Math.pow(node2.x-node1.x,2)+Math.pow(node2.y-node1.y,2)+Math.pow(node2.z-node1.z,2)),1/2);
	geometry.vertices.push( node2.position );
	var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.1} ) );
	scene.add( line );
	node.append("text").text(function() { return max });
}
