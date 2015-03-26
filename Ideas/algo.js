<script>
var closestNode =function()
{
	var hollowSphere=new THREE.sphere(material);
	var min=net THREE.geometry(450,450,450);
	var sphereGeometry = new THREE.SphereGeometry(0, 0, 0);
	var sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
 	// position the sphere
    sphere.position.x = mouseX;
    sphere.position.y = mouseY;
    sphere.position.z = mouseZ;
    var max=450;
    var min=0;
    while(hollowSphere.intersect(geometry)!=2)
	{
		hollowsphere.setRadius((min+max)/2);
		if(hollowSphere.intersect(geometry)>2)
		{
			min=(min+max)/2;
		}
		else
		{
			max=(min+max)/2;
		}
	}								
	var finalRadius=hollowSphere.getRadius();
}
var intersect= function()
{
	raycaster.setFromCamera( mouse, camera );
	var INTERSECTED=null;
	var intersects = raycaster.intersectObjects( scene.children );
	if ( intersects.length > 0 ) 
	{
		if ( INTERSECTED != intersects[ 0 ].object ) 
		{
			if ( INTERSECTED ) INTERSECTED.material.program = programStroke;
			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.material.program = programFill;
		}
	} 
	else 
	{
		if ( INTERSECTED ) INTERSECTED.material.program = programStroke;
		INTERSECTED = null;
	}
	return INTERSECTED;
}
</script>