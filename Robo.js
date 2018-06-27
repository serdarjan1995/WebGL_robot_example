// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' + 
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));\n' + // Light direction
  '  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = vec4(a_Color.rgb * nDotL + vec3(0.1), a_Color.a);\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of attribute and uniform variables
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (a_Position < 0 || !u_MvpMatrix || !u_NormalMatrix) {
    console.log('Failed to get the storage location of attribute or uniform variable');
    return;
  }

  // Calculate the view projection matrix
  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 440.0);
  viewProjMatrix.lookAt(20.0, 10.0,100.0,0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
  

  
  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); };

	  // Current rotation angle
  var currentAngle = 0.0;

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    //draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
	draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix, currentAngle);
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
  
  
}

var ANGLE_STEP = 3.0;     // The increments of rotation angle (degrees)
var positionMove = 0.0;
var g_robotAngle = 0.0; 
var g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
var g_backAngle=0.0;
var g_headAngle = 0.0;
var backAngleRadian=0.0;
var sideAngleRadian=0.0;
var g_leg1Angle = 0.0;
var g_leg2Angle = 0.0;
var g_arm1xAngle = 180.0;
var g_arm1zAngle = -6.0;
var g_arm2xAngle = 180.0;
var g_arm2zAngle = 6.0;
var g_jumpP = 0.0;
var g_jumpM = 0.0;
var g_jumpStep = 0.0;
var robotXtranslate=0.0;
var robotZtranslate=0.0;
var stepX=0.5;
var stepZ=0.5;
var walkHandCheck=0.0;



function keydown(ev, gl, o, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
  switch (ev.keyCode) {
	  
	case 79: // 'o'  key -> the positive rotation of head around the y-axis
      if (g_headAngle < 55.0) g_headAngle += ANGLE_STEP;
      break;
	case 80: // 'p'  key -> the negative rotation of head around the y-axis
      if (g_headAngle > -55.0) g_headAngle -= ANGLE_STEP;
      break;
	  
    case 37: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_robotAngle = (g_robotAngle + ANGLE_STEP) % 360;
      break;
    case 39: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_robotAngle = (g_robotAngle - ANGLE_STEP) % 360;
      break;
	  
	  //leg1
	case 87: // 's' key -> the positive rotation of leg1 around the x-axis
      if (g_leg1Angle > -80.0) g_leg1Angle -= ANGLE_STEP;
      break;
	case 83: // 'w' key -> the negative rotation of leg1 around the x-axis
      if (g_leg1Angle < 0.0) g_leg1Angle += ANGLE_STEP;
      break;
	  
	  //leg2
	case 69: // 'd' key -> the positive rotation of joint1 around the x-axis
      if (g_leg2Angle > -80.0) g_leg2Angle -= ANGLE_STEP;
      break;
	case 68: // 'e' key -> the negative rotation of joint1 around the x-axis
      if (g_leg2Angle < 0.0) g_leg2Angle += ANGLE_STEP;
      break;
	  
	  //arm1
    case 90: // 'z' key -> the positive rotation of arm1 around the x-axis
      if (g_arm1xAngle > 0.0) g_arm1xAngle -= ANGLE_STEP;
      break;
	case 88: // 'x' key -> the negative rotation of arm1 around the x-axis
      if (g_arm1xAngle < 180.0) g_arm1xAngle += ANGLE_STEP;
      break;
	  
	case 86: // 'v'key -> the positive rotation of arm1 around the z-axis
      if (g_arm1zAngle < -6.0)  g_arm1zAngle += ANGLE_STEP;
      break;
    case 67: // 'c'key -> the negative rotation of arm1 around the z-axis
      if (g_arm1zAngle > -90.0) g_arm1zAngle -= ANGLE_STEP;
      break;
	  
	  //arm2
	  case 84: // 't' key -> the positive rotation of arm2 around the x-axis
      if (g_arm2xAngle > 0.0) g_arm2xAngle -= ANGLE_STEP;
      break;
	case 89: // 'y' key -> the negative rotation of arm2 around the x-axis
      if (g_arm2xAngle < 180.0) g_arm2xAngle += ANGLE_STEP;
      break;
	  
	case 85: // 'u'key -> the positive rotation of arm2 around the z-axis
      if (g_arm2zAngle < 90.0)  g_arm2zAngle += ANGLE_STEP;
      break;
    case 73: // 'i'key -> the negative rotation of arm2 around the z-axis
      if (g_arm2zAngle > 6.0) g_arm2zAngle -= ANGLE_STEP;
      break;
	  
	case 32: // 'space'key -> the negative rotation of arm2 around the z-axis
      g_jumpP = 0.0; g_jumpM = 6.0; g_jumpStep=0.2;
      break;
	  ////////////////////////////////
	 case 38: // Up arrow key ->move forward to positive z axis
       g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   
	   robotZtranslate+=(Math.cos(g_robotAngleRadian))*(stepZ/2);
	   if(robotZtranslate<-18 || robotZtranslate>28){
	    robotZtranslate-=(Math.cos(g_robotAngleRadian))*(stepZ/2);
	   }
	   
	   robotXtranslate+=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += 4*ANGLE_STEP;
	   g_arm2xAngle -= 4*ANGLE_STEP;
	   g_leg1Angle  -=4*ANGLE_STEP;
	   g_leg2Angle  +=4*ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= 4*ANGLE_STEP;
	   g_arm2xAngle += 4*ANGLE_STEP;
	   g_leg1Angle  +=4*ANGLE_STEP;
	   g_leg2Angle  -=4*ANGLE_STEP;
	   }
      break;
	
	case 66: // 'b'key -> move left
      g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   sideAngleRadian=((Math.PI)/2  +g_robotAngleRadian);
	   robotZtranslate+=(Math.cos(sideAngleRadian))*(stepZ/2);
	   if(robotZtranslate<-18 || robotZtranslate>28){
	   robotZtranslate-=(Math.cos(sideAngleRadian))*(stepZ/2);
	   }
	   robotXtranslate+=(Math.sin(sideAngleRadian))*(stepZ/2);
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += ANGLE_STEP;
	   g_arm2xAngle -= ANGLE_STEP;
	   g_leg1Angle  -=ANGLE_STEP;
	   g_leg2Angle  +=ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= ANGLE_STEP;
	   g_arm2xAngle += ANGLE_STEP;
	   g_leg1Angle  +=ANGLE_STEP;
	   g_leg2Angle  -=ANGLE_STEP;
	   }
      break;
    case 40: // Down arrow key -> move backward
	   
	   
	   g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   backAngleRadian=(Math.PI  +g_robotAngleRadian);
	   robotZtranslate+=(Math.cos(backAngleRadian))*(stepZ/2);
	   if(robotZtranslate<-18 || robotZtranslate>28){
	   robotZtranslate-=(Math.cos(backAngleRadian))*(stepZ/2);
	   }
	   robotXtranslate+=(Math.sin(backAngleRadian))*(stepZ/2);
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += ANGLE_STEP;
	   g_arm2xAngle -= ANGLE_STEP;
	   g_leg1Angle  -=ANGLE_STEP;
	   g_leg2Angle  +=ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= ANGLE_STEP;
	   g_arm2xAngle += ANGLE_STEP;
	   g_leg1Angle  +=ANGLE_STEP;
	   g_leg2Angle  -=ANGLE_STEP;
	   }
      break;
	  
	case 77: // 'm'key -> move right
      g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   sideAngleRadian=(-(Math.PI)/2  +g_robotAngleRadian);
	   robotZtranslate+=(Math.cos(sideAngleRadian))*(stepZ/2);
	   if(robotZtranslate<-18 || robotZtranslate>28){
	   robotZtranslate-=(Math.cos(sideAngleRadian))*(stepZ/2);
	   }
	   robotXtranslate+=(Math.sin(sideAngleRadian))*(stepZ/2);
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += ANGLE_STEP;
	   g_arm2xAngle -= ANGLE_STEP;
	   g_leg1Angle  -=ANGLE_STEP;
	   g_leg2Angle  +=ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= ANGLE_STEP;
	   g_arm2xAngle += ANGLE_STEP;
	   g_leg1Angle  +=ANGLE_STEP;
	   g_leg2Angle  -=ANGLE_STEP;
	   }
      break;
	  
	case 75: // 'k' run forward to whatever the robot is looking at
	   g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   
	   robotZtranslate+=(Math.cos(g_robotAngleRadian))*2*stepZ;
	   if(robotZtranslate<-18 || robotZtranslate>28){
	    robotZtranslate-=(Math.cos(g_robotAngleRadian))*2*stepZ;
	   }
	   
	   robotXtranslate+=(Math.sin(g_robotAngleRadian))*2*stepZ;
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*2*stepZ;;
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += 4*ANGLE_STEP;
	   g_arm2xAngle -= 4*ANGLE_STEP;
	   g_leg1Angle  -=4*ANGLE_STEP;
	   g_leg2Angle  +=4*ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= 4*ANGLE_STEP;
	   g_arm2xAngle += 4*ANGLE_STEP;
	   g_leg1Angle  +=4*ANGLE_STEP;
	   g_leg2Angle  -=4*ANGLE_STEP;
	   }
      break;
	case 72: // 'h' walk forward to whatever the robot is looking at 
	   g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   
	   robotZtranslate+=(Math.cos(g_robotAngleRadian))*(stepZ/2);
	   if(robotZtranslate<-18 || robotZtranslate>28){
	    robotZtranslate-=(Math.cos(g_robotAngleRadian))*(stepZ/2);
	   }
	   
	   robotXtranslate+=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += 4*ANGLE_STEP;
	   g_arm2xAngle -= 4*ANGLE_STEP;
	   g_leg1Angle  -=4*ANGLE_STEP;
	   g_leg2Angle  +=4*ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= 4*ANGLE_STEP;
	   g_arm2xAngle += 4*ANGLE_STEP;
	   g_leg1Angle  +=4*ANGLE_STEP;
	   g_leg2Angle  -=4*ANGLE_STEP;
	   }
      break;
	case 78: // 'n' move backward to whatever the robot is looking at 
	   g_robotAngleRadian=Math.PI * g_robotAngle / 180.0;
	   backAngleRadian=(Math.PI  +g_robotAngleRadian);
	   robotZtranslate+=(Math.cos(backAngleRadian))*(stepZ/2);
	   if(robotZtranslate<-18 || robotZtranslate>28){
	   robotZtranslate-=(Math.cos(backAngleRadian))*(stepZ/2);
	   }
	   robotXtranslate+=(Math.sin(backAngleRadian))*(stepZ/2);
	   if(robotXtranslate<-49 || robotXtranslate>49){
	    robotXtranslate-=(Math.sin(g_robotAngleRadian))*(stepZ/2);
	   }
      if(g_arm1xAngle<150.0){
	   walkHandCheck=0.0;}
	   
	   if(g_arm1xAngle>210.0){
	   walkHandCheck=1.0;}
	   if(walkHandCheck==0.0){
	   g_arm1xAngle += ANGLE_STEP;
	   g_arm2xAngle -= ANGLE_STEP;
	   g_leg1Angle  -=ANGLE_STEP;
	   g_leg2Angle  +=ANGLE_STEP;
	   }else{
	   g_arm1xAngle -= ANGLE_STEP;
	   g_arm2xAngle += ANGLE_STEP;
	   g_leg1Angle  +=ANGLE_STEP;
	   g_leg2Angle  -=ANGLE_STEP;
	   }
      break;
	  
	  
    default: return; // Skip drawing at no effective action
  }
  // Draw
  draw(gl, o, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
}

var g_bodyBuffer = null;
var g_arm1Buffer = null;
var g_arm2Buffer = null; 
var g_headBuffer = null;
var g_neckBuffer = null;
var g_leg1Buffer = null;
var g_leg2Buffer = null;
var g_foot1Buffer = null;
var g_foot2Buffer = null;
var g_earBuffer = null;
var g_eyeBuffer=null;
var g_boxBuffer=null;
var g_bulbulBuffer=null;
var g_baseBuffer=null;
var g_chair1Buffer=null;
var g_chair2Buffer=null;
var g_shapeBuffer=null;
var g_arabaAltBuffer=null;
var g_arabaUstBuffer=null;
var g_duvarBuffer=null;
var g_roadBuffer=null;
var g_tekerlikBuffer=null;

function initVertexBuffers(gl){
  // Vertex coordinate (prepare coordinates of cuboids for all segments)
    // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  var vertices_body = new Float32Array([
     1.5, 8.0, 1.0, -1.5, 8.0, 1.0,   -1.5, 0.0,  1.0,   1.5, 0.0,  1.0, // v0-v1-v2-v3 front
    1.5, 8.0, 1.0,  1.5, 0.0,   1.0,    1.5, 0.0,  -1.0,  1.5, 8.0, -1.0, // v0-v3-v4-v5 right
    1.5, 8.0, 1.0,  1.5, 8.0, -1.0,   -1.5, 8.0, -1.0,  -1.5, 8.0, 1.0, // v0-v5-v6-v1 up
   -1.5, 8.0, 1.0, -1.5, 8.0, -1.0,   -1.5, 0.0,  -1.0,  -1.5, 0.0,  1.0, // v1-v6-v7-v2 left
   -1.5, 0.0, -1.0,  1.5, 0.0,  -1.0,    1.5, 0.0,   1.0,  -1.5, 0.0,  1.0, // v7-v4-v3-v2 down
    1.5, 0.0, -1.0, -1.5, 0.0,  -1.0,   -1.5, 8.0, -1.0,   1.5, 8.0,-1.0  // v4-v7-v6-v5 back
  ]);
  
  var vertices_leg1 = new Float32Array([
    1.0, 0.0,   0.5,   0.5,  0.0,  0.5,   0.5, -7.0,  0.5,  1.0, -7.0, 0.5, // v0-v1-v2-v3 front
    1.0, 0.0,   0.5,   1.0, -7.0, 0.5,   1.0, -7.0, -0.5,  1.0, 0.0, -0.5, // v0-v3-v4-v5 right
    1.0, 0.0,   0.5,   1.0,  0.0, -0.5,   0.5,   0.0, -0.5,  0.5, 0.0, 0.5, // v0-v5-v6-v1 up
    0.5, 0.0,   0.5,   0.5,  0.0, -0.5,   0.5, -7.0, -0.5,  0.5, -7.0, 0.5, // v1-v6-v7-v2 left
    0.5, -7.0, -0.5,  1.0, -7.0, -0.5,  1.0, -7.0,  0.5,  0.5, -7.0, 0.5, // v7-v4-v3-v2 down
    1.0, -7.0, -0.5,  0.5, -7.0, -0.5,  0.5,   0.0, -0.5,  1.0, 0.0, -0.5  // v4-v7-v6-v5 back
  ]);
  
  var vertices_leg2 = new Float32Array([
    -0.5,  0.0,   0.5,    -1.0,  0.0,  0.5,   -1.0, -7.0,  0.5,    -0.5, -7.0, 0.5, // v0-v1-v2-v3 front
    -0.5,  0.0,   0.5,    -0.5, -7.0, 0.5,   -0.5, -7.0, -0.5,   -0.5, 0.0, -0.5, // v0-v3-v4-v5 right
    -0.5,  0.0,   0.5,    -0.5,  0.0, -0.5,   -1.0,  0.0,  -0.5,   -1.0, 0.0, 0.5, // v0-v5-v6-v1 up
    -1.0,  0.0,   0.5,    -1.0,  0.0, -0.5,   -1.0, -7.0, -0.5,   -1.0, -7.0, 0.5, // v1-v6-v7-v2 left
    -1.0, -7.0, -0.5,    -0.5, -7.0, -0.5,  -0.5, -7.0,  0.5,   -1.0, -7.0, 0.5, // v7-v4-v3-v2 down
    -0.5, -7.0, -0.5,    -1.0, -7.0, -0.5,  -1.0,  0.0,  -0.5,   -0.5, 0.0, -0.5  // v4-v7-v6-v5 back
  ]);
  
  var vertices_foot = new Float32Array([
    0.25, 0.25,  2.5,     -0.25,  0.25, 2.5,    -0.25, -0.25,  2.5,  0.25, -0.25, 2.5, // v0-v1-v2-v3 front
    0.25, 0.25,  2.5,     0.25, -0.25, 2.5,     0.25, -0.25, 0.0,  0.25, 0.25, 0.0, // v0-v3-v4-v5 right
    0.25, 0.25,  2.5,     0.25,  0.25, 0.0,     -0.25, 0.25, 0.0,  -0.25, 0.25, 2.5, // v0-v5-v6-v1 up
    -0.25, 0.25,  2.5,   -0.25,  0.25, 0.0,    -0.25, -0.25, 0.0,  -0.25, -0.25, 2.5, // v1-v6-v7-v2 left
    -0.25, -0.25, 0.0,    0.25, -0.25, 0.0,    0.25, -0.25, 2.5,  -0.25, -0.25, 2.5, // v7-v4-v3-v2 down
    0.25, -0.25, 0.0,    -0.25, -0.25, 0.0,    -0.25, 0.25, 0.0,  0.25, 0.25, 0.0  // v4-v7-v6-v5 back
  ]);
  
  
  var vertices_neck = new Float32Array([ 
    0.5, 9.0, 0.5,   -0.5, 9.0, 0.5,    -0.5, 8.0,  0.5,   0.5, 8.0, 0.5, // v0-v1-v2-v3 front
    0.5, 9.0, 0.5,    0.5, 8.0, 0.5,     0.5, 8.0, -0.5,   0.5, 9.0, -0.5, // v0-v3-v4-v5 right
    0.5, 9.0, 0.5,    0.5, 9.0, -0.5,   -0.5, 9.0, -0.5,  -0.5, 9.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 9.0, 0.5,   -0.5, 9.0, -0.5,   -0.5, 8.0, -0.5,  -0.5, 8.0,  0.5, // v1-v6-v7-v2 left
   -0.5, 8.0, -0.5,   0.5, 8.0, -0.5,    0.5, 8.0,  0.5,  -0.5, 8.0,  0.5, // v7-v4-v3-v2 down
    0.5, 8.0, -0.5,  -0.5, 8.0, -0.5,   -0.5, 9.0, -0.5,   0.5, 9.0, -0.5  // v4-v7-v6-v5 back
  ]);
  
  var vertices_head = new Float32Array([ 
    1.0, 10.5, 0.8,   -1.0, 10.5, 0.8,    -1.0, 9.0, 0.8,    1.0, 9.0, 0.8, // v0-v1-v2-v3 front
    1.0, 10.5, 0.8,    1.0, 9.0,  0.8,     1.0, 9.0, -0.8,   1.0, 10.5, -0.8, // v0-v3-v4-v5 right
    1.0, 10.5, 0.8,    1.0, 10.5, -0.8,   -1.0, 10.5, -0.8,  -1.0, 10.5, 0.8, // v0-v5-v6-v1 up
   -1.0, 10.5, 0.8,   -1.0, 10.5, -0.8,   -1.0, 9.0, -0.8,   -1.0, 9.0, 0.8, // v1-v6-v7-v2 left
   -1.0, 9.0, -0.8,    1.0, 9.0, -0.8,     1.0, 9.0, 0.8,    -1.0, 9.0, 0.8, // v7-v4-v3-v2 down
    1.0, 9.0, -0.8,   -1.0, 9.0, -0.8,    -1.0, 10.5, -0.8,   1.0, 10.5, -0.8  // v4-v7-v6-v5 back
  ]);
  
  var vertices_ear = new Float32Array([ 
    1.2, 10.0, 0.3,   -1.2, 10.0,  0.3,    -1.2, 9.5, 0.3,     1.2, 9.5, 0.3, // v0-v1-v2-v3 front
    1.2, 10.0, 0.3,    1.2, 9.5,   0.3,     1.2, 9.5, -0.3,    1.2, 10.0, -0.3, // v0-v3-v4-v5 right
    1.2, 10.0, 0.3,    1.2, 10.0, -0.3,    -1.2, 10.0, -0.3,  -1.2, 10.0, 0.3, // v0-v5-v6-v1 up
   -1.2, 10.0, 0.3,   -1.2, 10.0, -0.3,    -1.2, 9.5, -0.3,   -1.2, 9.5, 0.3, // v1-v6-v7-v2 left
   -1.2, 9.5, -0.3,    1.2, 9.5,  -0.3,     1.2, 9.5,   0.3,  -1.2, 9.5, 0.3, // v7-v4-v3-v2 down
    1.2, 9.5, -0.3,   -1.2, 9.5,  -0.3,    -1.2, 10.0, -0.3,   1.2, 10.0, -0.3  // v4-v7-v6-v5 back
  ]);
  
  var vertices_arm = new Float32Array([ 
     0.25, 5.0, 0.4,   -0.25, 5.0, 0.4,   -0.25, 0.0,  0.4,   0.25, 0.0, 0.4, // v0-v1-v2-v3 front
     0.25, 5.0, 0.4,   0.25, 0.0, 0.4,   0.25, 0.0, -0.4,   0.25, 5.0, -0.4, // v0-v3-v4-v5 right
     0.25, 5.0, 0.4,   0.25, 5.0, -0.4,  -0.25, 5.0, -0.4,   -0.25, 5.0, 0.4, // v0-v5-v6-v1 up
     -0.25, 5.0, 0.4,   -0.25, 5.0, -0.4,  -0.25, 0.0, -0.4,   -0.25, 0.0, 0.4, // v1-v6-v7-v2 left
     -0.25, 0.0, -0.4,  0.25, 0.0, -0.4,  0.25, 0.0,  0.4,   -0.25, 0.0, 0.4, // v7-v4-v3-v2 down
     0.25, 0.0, -0.4,  -0.25, 0.0, -0.4,  -0.25, 5.0, -0.4,   0.25, 5.0, -0.4,  // v4-v7-v6-v5 back
  ]);

  // Normal
  var normals = new Float32Array([
     0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
     1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
     0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
     0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
     0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);

  var vertices_box = new Float32Array([ 
    1.0, 4.0, 0.8,     -1.0, 4.0, 0.8,      -1.0,  -4.0, 0.8,      1.0, -4.0, 0.8, // v0-v1-v2-v3 front
    1.0, 4.0, 0.8,      1.0,-4.0,  0.8,      1.0, -4.0, -0.8,     1.0, 4.0, -0.8, // v0-v3-v4-v5 right
    1.0, 4.0, 0.8,      1.0, 4.0, -0.8,     -1.0,  4.0, -0.8,     -1.0, 4.0, 0.8, // v0-v5-v6-v1 up
   -1.0, 4.0, 0.8,     -1.0, 4.0, -0.8,     -1.0, -4.0, -0.8,    -1.0, -4.0, 0.8, // v1-v6-v7-v2 left
   -1.0, -4.0, -0.8,    1.0, -4.0, -0.8,     1.0,  -4.0, 0.8,     -1.0, -4.0, 0.8, // v7-v4-v3-v2 down
    1.0, -4.0, -0.8,   -1.0, -4.0, -0.8,    -1.0,  4.0, -0.8,      1.0, 4.0, -0.8  // v4-v7-v6-v5 back
  ]);
  
  var vertices_EYE = new Float32Array([ 
    1.0, 0.5, 0.3,     -1.0, 0.5, 0.3,      -1.0, -0.5, 0.3,      1.0, -0.5, 0.3, // v0-v1-v2-v3 front
    1.0, 0.5, 0.3,      1.0,-0.5,  0.3,      1.0, -0.5, -0.3,     1.0,  0.5, -0.3, // v0-v3-v4-v5 right
    1.0, 0.5, 0.3,      1.0, 0.5, -0.3,     -1.0,  0.5, -0.3,     -1.0, 0.5, 0.3, // v0-v5-v6-v1 up
   -1.0, 0.5, 0.3,     -1.0, 0.5, -0.3,     -1.0, -0.5, -0.3,    -1.0, -0.5, 0.3, // v1-v6-v7-v2 left
   -1.0, -0.5, -0.3,    1.0, -0.5, -0.3,     1.0, -0.5, 0.3,     -1.0, -0.5, 0.3, // v7-v4-v3-v2 down
    1.0, -0.5, -0.3,   -1.0, -0.5, -0.3,    -1.0,  0.5, -0.3,      1.0, 0.5, -0.3  // v4-v7-v6-v5 back
  ]);

  var vertices_bulbul = new Float32Array([ 
    0.0, 13.0, 0.0,      0.0, 13.0, 0.0,      -10.0, -7.0, 10.0,       10.0, -7.0, 10.0, // v0-v1-v2-v3 front
    0.0, 13.0, 0.0,      10.0, -7.0, 10.0,     10.0, -7.0, -10.0,       0.0, 13.0, 0.0, // v0-v3-v4-v5 right
    0.0, 13.0, 0.0,       0.0, 13.0, 0.0,       0.0, 13.0, 0.0,         0.0, 13.0, 0.0, // v0-v5-v6-v1 up
    0.0, 13.0, 0.0,       0.0, 13.0, 0.0,     -10.0, -7.0, -10.0,     -10.0, -7.0, 10.0, // v1-v6-v7-v2 left
   -10.0, -7.0, -10.0,   10.0, -7.0, -10.0,    10.0, -7.0, 10.0,      -10.0, -7.0, 10.0, // v7-v4-v3-v2 down
    10.0, -7.0, -10.0,  -10.0, -7.0, -10.0,    0.0, 13.0, 0.0,         0.0, 13.0, 0.0  // v4-v7-v6-v5 back
  ]);
  var vertices_base = new Float32Array([ 
    50.0, -7.0, 40.0,   -50.0, -7.0, 40.0,    -50.0, -9.0, 40.0,    50.0,-9.0, 40.0, // v0-v1-v2-v3 front
    50.0, -7.0,40.0,    50.0, -9.0, 40.0,     50.0, -9.0, -20.0,   50.0, -7.0, -20.0, // v0-v3-v4-v5 right
    50.0, -7.0, 40.0,    50.0, -7.0, -20.0,    -50.0, -7.0, -20.0,  -50.0, -7.0, 40.0, // v0-v5-v6-v1 up
   -50.0, -7.0, 40.0,   -50.0, -7.0, -20.0,   -50.0,-9.0, -20.0,   -50.0, -9.0, 40.0, // v1-v6-v7-v2 left
   -50.0, -9.0, -20.0,   50.0, -9.0, -20.0,     50.0,-9.0, 40.0,    -50.0, -9.0, 40.0, // v7-v4-v3-v2 down
    50.0, -9.0, -20.0,   -50.0,-9.0, -20.0,    -50.0, -7.0, -20.0,   50.0, -7.0, -20.0  // v4-v7-v6-v5 back
  ]);
  var vertices_road = new Float32Array([ 
    50.0, -6.0, 40.0,   -50.0, -6.0, 40.0,    -50.0, -7.0, 40.0,    50.0,-7.0, 40.0, // v0-v1-v2-v3 front
    50.0, -6.0,40.0,    50.0, -7.0, 40.0,     50.0, -7.0, 30.0,   50.0, -6.0, 30.0, // v0-v3-v4-v5 right
    50.0, -6.0, 40.0,    50.0, -6.0, 30.0,    -50.0, -6.0, 30.0,  -50.0, -6.0, 40.0, // v0-v5-v6-v1 up
   -50.0, -6.0, 40.0,   -50.0, -6.0, 30.0,   -50.0,-7.0, 30.0,   -50.0, -7.0, 40.0, // v1-v6-v7-v2 left
   -50.0, -7.0, 30.0,   50.0, -7.0, 30.0,     50.0,-7.0, 40.0,    -50.0, -7.0, 40.0, // v7-v4-v3-v2 down
    50.0, -7.0, 30.0,   -50.0,-7.0, 30.0,    -50.0, -6.0, 30.0,   50.0, -6.0, 30.0  // v4-v7-v6-v5 back
  ]);

 var vertices_chair1 = new Float32Array([ 
    -11.0, 0.0, 0.0,   -18.0, 0.0, 0.0,    -18.0, -7.0, 0.0,    -11.0, -7.0, 0.0, // v5-v4-v7-v6 1
    -11.0, 0.0, 0.0,    -11.0, -7.0, 0.0,     -11.0, -7.0, -5.0,   -11.0, 0.0, -5.0, // v5-v6-v9-v2 2
    -11.0, 0.0, 0.0,   -11.0, 0.0, -5.0,   -18.0, 0.0, -5.0,     -18.0, 0.0, 0.0, // v5-v2-v3-v4 3
   -18.0, 0.0, 0.0,   -18.0, 0.0, -5.0,   -18.0, -7.0, -5.0,    -18.0, -7.0, 0.0, // v4-v3-v8-v7 4
   -18.0, -7.0, -5.0,   -11.0, -7.0, -5.0,     -11.0, -7.0, 0.0,  -18.0, -7.0, 0.0, // v8-v9-v6-v7 5
    -11.0, -7.0, -5.0,   -18.0, -7.0,- 5.0,    -18.0, 0.0, -5.0,   -11.0, 0.0, -5.0  // v6-v7-v8-v9 6
  ]);
  var vertices_chair2 = new Float32Array([ 
    -11.0, 7.0, -5.1,   -18.0, 7.0, -5.1,    -18.0,- 7.0, -5.1,    -11.0,- 7.0, -5.1, // v0-v1-v10-v11 1
    -11.0, 7.0, -5.1,   -11.0, -7.0, -5.1,    -11.0, -7.0, -6.0,   -11.0, 7.0, -6.0, // v0-v1-v9-v8 2
    -11.0, 7.0, -5.1,   -11.0, 7.0, -6.0,    -18.0, 7.0, -6.0,    -18.0, 7.0, -5.1, // v12-v13-v10-v11 3
   -18.0, 7.0, -5.1,   -18.0, 7.0, -6.0,   -18.0, -7.0, -6.0,   -18.0, -7.0, -5.1, // v12-v13-v9-v8 4
   -18.0, -7.0, -6.0,   -11.0, -7.0, -6.0,     -11.0, -7.0, -5.1,   -18.0, -7.0, -5.1, // v1-v10-v13-v9 5
     -18.0, -7.0, -6.0,   -18.0, -7.0, -6.0,    -18.0, 7.0, -6.0,   -11.0, 7.0, -6.0  // v0-v11-v12-v8 6
  ]);
  var vertices_shape = new Float32Array([ 
    0.5, 2.0, 1.0,   -1.5, 2.0, 1.0,    -1.5, -1.0, 1.0,      0.5, -1.0, 1.0, // v0-v1-v2-v3 front
    0.5, 2.0, 1.0,    0.5, -1.0, 1.0,    0.5, -1.0, -1.0,    0.5,  2.0, -1.0, // v0-v3-v4-v5 right
    0.5, 2.0, 1.0,    0.5, 2.0, -1.0,   -1.5, 2.0, -1.0,      -1.5, 2.0, 1.0, // v0-v5-v6-v1 up
   -1.5, 2.0, 1.0,   -1.5, 2.0, -1.0,   -1.5, -1.0, -1.0,     -1.5, -1.0, 1.0, // v1-v6-v7-v2 left
   -1.5,-1.0, -1.0,   0.5, -1.0, -1.0,  0.5, -1.0, 1.0,    -1.5, -1.0, 1.0, // v7-v4-v3-v2 down
   0.5, -1.0, -1.0,  -1.5, -1.0, -1.0, -1.5, 2.0, -1.0,     0.5,  2.0, -1.0  // v4-v7-v6-v5 back
  ]);
  
  var vertices_arabaAlt = new Float32Array([ 
    3.5, 0.0, 2.0,   -3.5, 0.0, 2.0,    -3.5, -1.5, 2.0,    3.5, -1.5, 2.0, // v0-v1-v2-v3 front
    3.5, 0.0, 2.0,    3.5,-1.5,  2.0,     3.5, -1.5, -2.0,   3.5, 0.0, -2.0, // v0-v3-v4-v5 right
    3.5, 0.0, 2.0,    3.5, 0.0, -2.0,   -3.5, 0.0, -2.0,     -3.5, 0.0, 2.0, // v0-v5-v6-v1 up
   -3.5, 0.0, 2.0,   -3.5, 0.0, -2.0,   -3.5, -1.5, -2.0,    -3.5, -1.5, 2.0, // v1-v6-v7-v2 left
   -3.5, -1.5, -2.0,  3.5, -1.5, -2.0,     3.5, -1.5, 2.0,    -3.5, -1.5, 2.0, // v7-v4-v3-v2 down
    3.5, -1.5, -2.0, -3.5, -1.5, -2.0,    -3.5, 0.0, -2.0,   3.5, 0.0, -2.0 // v4-v7-v6-v5 back
  ]);
  var vertices_tekerlik = new Float32Array([ 
    3.0, -0.5, 2.2,    2.0, -0.5, 2.2,    2.0, -1.3, 2.2,       3.0, -1.3, 2.2, // v0-v1-v2-v3 front
    3.0, -0.5, 2.2,    3.0,-1.3,  2.2,    3.0, -1.3, -2.2,      3.0, -0.5, -2.2, // v0-v3-v4-v5 right
    3.0, -0.5, 2.2,    3.0, -0.5, -2.2,   2.0, -0.5, -2.2,      2.0, -0.5, 2.2, // v0-v5-v6-v1 up
    2.0, -0.5, 2.2,     2.0, -0.5, -2.2,  2.0, -1.3, -2.2,       2.0, -1.3, 2.2, // v1-v6-v7-v2 left
    2.0, -1.3, -2.2,    3.0, -1.3, -2.2,  3.0, -1.3, 2.2,       2.0, -1.3, 2.2, // v7-v4-v3-v2 down
    3.0, -1.3, -2.2,   2.0, -1.3, -2.2,   2.0, -0.5, -2.2,      3.0, -0.5, -2.2 // v4-v7-v6-v5 back
  ]);
  var vertices_arabaUst = new Float32Array([ 
    1.5, 1.0, 2.0,   -1.5, 1.0, 2.0,    -2.5, 0.0, 2.0,      2.5, 0.0, 2.0, // v0-v1-v2-v3 front
    1.5, 1.0, 2.0,    2.5, 0.0,  2.0,     2.5, 0.0, -2.0,     1.5, 1.0, -2.0, // v0-v3-v4-v5 right
    1.5, 1.0, 2.0,    1.5, 1.0, -2.0,   -1.5, 1.0, -2.0,     -1.5, 1.0, 2.0, // v0-v5-v6-v1 up
   -1.5, 1.0, 2.0,   -1.5, 1.0, -2.0,   -2.5, 0.0, -2.0,      -2.5, 0.0, 2.0, // v1-v6-v7-v2 left
   -2.5, 0.0, -2.0,    2.5, 0.0, -2.0,     2.5, 0.0, 2.0,     -2.5, 0.0, 2.0, // v7-v4-v3-v2 down
    2.5, 0.0, -2.0,   -2.5, 0.0, -2.0,    -1.5, 1.0, -2.0,    1.5, 1.0, -2.0 // v4-v7-v6-v5 back
  ]);
  var vertices_duvar = new Float32Array([ 
    30.0, 20.0, -20.0,   -30.0, 20.0, -20.0,    -30.0, -7.0, -20.0,    30.0, -7.0, -20.0, // v0-v1-v2-v3 front
    30.0, 20.0, -20.0,    30.0,-7.0,  -20.0,     30.0, -7.0, -22.0,   30.0, 20.0, -22.0, // v0-v3-v4-v5 right
    30.0, 20.0, -20.0,    30.0, 20.0, -22.0,   -30.0, 20.0, -22.0,  -30.0, 20.0, -20.0, // v0-v5-v6-v1 up
   -30.0, 20.0, -20.0,   -30.0, 20.0, -22.0,   -30.0, -7.0, -22.0,   -30.0, -7.0, -20.0, // v1-v6-v7-v2 left
   -30.0, -7.0, -22.0,    30.0, -7.0, -22.0,     30.0, -7.0, -20.0,    -30.0, -7.0, -20.0, // v7-v4-v3-v2 down
    30.0, -7.0, -22.0,   -30.0, -7.0, -22.0,    -30.0, 20.0, -22.0,   30.0, 20.0, -22.0 // v4-v7-v6-v5 back
  ]);
  
  
  
  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);
  
  // Write coords to buffers, but don't assign to attribute variables
  g_leg1Buffer = initArrayBufferForLaterUse(gl, vertices_leg1, 3, gl.FLOAT);
  g_leg2Buffer = initArrayBufferForLaterUse(gl, vertices_leg2, 3, gl.FLOAT);
  g_foot1Buffer = initArrayBufferForLaterUse(gl, vertices_foot, 3, gl.FLOAT);
  g_foot2Buffer = initArrayBufferForLaterUse(gl, vertices_foot, 3, gl.FLOAT);
  g_bodyBuffer = initArrayBufferForLaterUse(gl, vertices_body, 3, gl.FLOAT);
  g_neckBuffer = initArrayBufferForLaterUse(gl, vertices_neck, 3, gl.FLOAT);
  g_headBuffer = initArrayBufferForLaterUse(gl, vertices_head, 3, gl.FLOAT);
  g_earBuffer = initArrayBufferForLaterUse(gl, vertices_ear, 3, gl.FLOAT);
  g_eyeBuffer = initArrayBufferForLaterUse(gl, vertices_EYE, 3, gl.FLOAT);
  g_arm1Buffer = initArrayBufferForLaterUse(gl, vertices_arm, 3, gl.FLOAT);
  g_arm2Buffer = initArrayBufferForLaterUse(gl, vertices_arm, 3, gl.FLOAT);
  g_boxBuffer = initArrayBufferForLaterUse(gl, vertices_box, 3, gl.FLOAT);
  g_bulbulBuffer = initArrayBufferForLaterUse(gl, vertices_bulbul, 3, gl.FLOAT);
  g_baseBuffer = initArrayBufferForLaterUse(gl, vertices_base, 3, gl.FLOAT);
  g_chair1Buffer = initArrayBufferForLaterUse(gl, vertices_chair1, 3, gl.FLOAT);
  g_chair2Buffer = initArrayBufferForLaterUse(gl, vertices_chair2, 3, gl.FLOAT);
  g_shapeBuffer = initArrayBufferForLaterUse(gl, vertices_shape, 3, gl.FLOAT);
  g_arabaAltBuffer = initArrayBufferForLaterUse(gl, vertices_arabaAlt, 3, gl.FLOAT);
  g_arabaUstBuffer = initArrayBufferForLaterUse(gl, vertices_arabaUst, 3, gl.FLOAT);
  g_duvarBuffer = initArrayBufferForLaterUse(gl, vertices_duvar, 3, gl.FLOAT);
  g_roadBuffer = initArrayBufferForLaterUse(gl, vertices_road, 3, gl.FLOAT);
  g_tekerlikBuffer = initArrayBufferForLaterUse(gl, vertices_tekerlik, 3, gl.FLOAT);
  if (!g_bodyBuffer || !g_earBuffer || !g_neckBuffer || !g_headBuffer) return -1;
  if (!g_foot1Buffer || !g_foot2Buffer ) return -1;
  if (!g_arm1Buffer || !g_arm2Buffer) return -1;

  // Write normals to a buffer, assign it to a_Normal and enable it
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4(),g_modelMatrixTmp = new Matrix4();

function draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix, currentAngle) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var colorBASE = new Float32Array([     // Colors
    0.9, 0.6, 0.9,  0.0, 0.6, 0.5,  0.9, 0.6, 0.9,  0.0, 0.6, 0.5,  // v0-v1-v2-v3 front
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.9, 0.6, 0.9,  // v0-v3-v4-v5 right
    1.0, 1.0, 0.0,  0.0, 0.6, 0.5,  0.5, 0.7, 0.5,  0.9, 0.6, 0.9,  // v0-v5-v6-v1 up
    0.0, 0.6, 0.5,  0.5, 0.7, 0.5,  1.0, 1.0, 0.0,  0.0, 0.6, 0.5,  // v1-v6-v7-v2 left
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.5, 0.7, 0.5,  // v7-v4-v3-v2 down
    1.0, 1.0, 0.0,  0.0, 0.6, 0.5,  1.0, 1.0, 0.0,  0.0, 0.6, 0.5   // v4-v7-v6-v5 back
  ]);
  
    var colorROAD = new Float32Array([     // Colors
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v0-v3-v4-v5 right
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v0-v5-v6-v1 up
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v1-v6-v7-v2 left
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0   // v4-v7-v6-v5 back
  ]);

  var colorBOX = new Float32Array([     // Colors
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  // v0-v1-v2-v3 front
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  // v0-v3-v4-v5 right
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  // v0-v5-v6-v1 up
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  // v1-v6-v7-v2 left
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  // v7-v4-v3-v2 down
    0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5,  0.0, 0.6, 0.5   // v4-v7-v6-v5 back
  ]);
  
    var multicolor = new Float32Array([    
    1.0, 1.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  // v0-v1-v2-v3 front(blue)
    1.0, 1.0, 1.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 1.0,  // v0-v3-v4-v5 right(green)
    1.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0,  // v0-v5-v6-v1 up(red)
    1.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  0.0, 1.0, 1.0   // v4-v7-v6-v5 back
  ]);
  
    var colorORANGE = new Float32Array([     // Colors
    0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  // v0-v1-v2-v3 front
    0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  // v0-v3-v4-v5 right
    0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  // v0-v5-v6-v1 up
    0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  // v1-v6-v7-v2 left
    0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  // v7-v4-v3-v2 down
    0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0,  0.6, 0.4, 0.0   // v4-v7-v6-v5 back
  ]);
  
  var colorBody = new Float32Array([     // Colors
    0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  // v0-v1-v2-v3 front
    0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  // v0-v3-v4-v5 right
    0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  // v0-v5-v6-v1 up
    0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  // v1-v6-v7-v2 left
    0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  // v7-v4-v3-v2 down
    0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0,  0.31, 0.55, 0.0   // v4-v7-v6-v5 back
  ]);
  
  var colorRED = new Float32Array([     // Colors
    0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  // v0-v1-v2-v3 front
    0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  // v0-v3-v4-v5 right
    0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  // v0-v5-v6-v1 up
    0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  // v1-v6-v7-v2 left
    0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  // v7-v4-v3-v2 down
    0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2,  0.6, 0.0, 0.2   // v4-v7-v6-v5 back
  ]);
  
  var colorShape = new Float32Array([     // Colors
    0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  // v0-v1-v2-v3 front
    0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  // v0-v3-v4-v5 right
    0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  // v0-v5-v6-v1 up
    0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  // v1-v6-v7-v2 left
    0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  // v7-v4-v3-v2 down
    0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75,  0.75, 0.75, 0.75   // v4-v7-v6-v5 back
  ]);
  
  var colorFoot = new Float32Array([     // Colors
    0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  // v0-v1-v2-v3 front
    0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  // v0-v3-v4-v5 right
    0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  // v0-v5-v6-v1 up
    0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  // v1-v6-v7-v2 left
    0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  // v7-v4-v3-v2 down
    0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1,  0.1, 0.1, 0.1// v4-v7-v6-v5 back
  ]);
  
  var colorLeg = new Float32Array([     // Colors
    0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  // v0-v1-v2-v3 front
    0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  // v0-v3-v4-v5 right
    0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  // v0-v5-v6-v1 up
    0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  // v1-v6-v7-v2 left
    0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0,  0.0, 0.15, 1.0   // v4-v7-v6-v5 back
  ]);
  
  var colors = new Float32Array([     // Colors
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0   // v4-v7-v6-v5 back
  ]);
  
  g_modelMatrix.setTranslate(0.0, -8.0, 0.0);
  
  if (!initArrayBuffer(gl, 'a_Color', colorBASE, 3, gl.FLOAT)) return -1;
  drawSegment(gl, n, g_baseBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  pushMatrix(g_modelMatrix);
  g_modelMatrix.scale(10.0, 20.0, 1.0);
  drawSegment(gl, n, g_duvarBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix=popMatrix();
 []
  
  
  if (!initArrayBuffer(gl, 'a_Color', multicolor, 3, gl.FLOAT)) return -1;
  pushMatrix(g_modelMatrix);
  g_modelMatrix.scale(1, 8, 1);
  g_modelMatrix.translate(25.0, 0.0, -19.2);
  g_modelMatrix.rotate(90, 0.0, 1.0, 0.0);
  drawSegment(gl, n, g_shapeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix=popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', multicolor, 3, gl.FLOAT)) return -1;
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(25.0, 15.0, -19.2);
  g_modelMatrix.rotate(currentAngle, 0.0, 0.0, 1.0);
  drawSegment(gl, n, g_boxBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix=popMatrix();
  
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(25.0, 15.0, -18.2);
  g_modelMatrix.rotate(-currentAngle, 0.0, 0.0, 1.0);
  drawSegment(gl, n, g_boxBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix=popMatrix();

  pushMatrix(g_modelMatrix);
  g_modelMatrix.scale(1, 4, 1);
  if (!initArrayBuffer(gl, 'a_Color', colorShape, 3, gl.FLOAT)) return -1;
  g_modelMatrix.translate(15.5, -1.0, 30.0);  
  drawSegment(gl, n, g_shapeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(14.5, 0.0, 0.0);
  drawSegment(gl, n, g_shapeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(-28.5, 0.0, 0.0);
  drawSegment(gl, n, g_shapeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(-16.5, 0.0, 0.0);
  drawSegment(gl, n, g_shapeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(-16.5, 0.0, 0.0);
  drawSegment(gl, n, g_shapeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-35.0, 0.0, 0.0);
  g_modelMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);  // Rotate around the y-axis
  drawSegment(gl, n, g_bulbulBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', colorRED, 3, gl.FLOAT)) return -1;
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(g_arabaX, -3.0, 35.0);
  g_modelMatrix.scale(2, 2, 2);
  g_modelMatrix.rotate(g_arabaRotY, 0.0, 1.0, 0.0);
  drawSegment(gl, n, g_arabaAltBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  
  drawSegment(gl, n, g_arabaUstBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  if (!initArrayBuffer(gl, 'a_Color', colorShape, 3, gl.FLOAT)) return -1;
  drawSegment(gl, n, g_tekerlikBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(-5.0, 0.0, 0.0);
  drawSegment(gl, n, g_tekerlikBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', colorROAD, 3, gl.FLOAT)) return -1;
  drawSegment(gl, n, g_roadBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw

  if (!initArrayBuffer(gl, 'a_Color', colorBOX, 3, gl.FLOAT)) return -1;
  drawSegment(gl, n, g_chair1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  drawSegment(gl, n, g_chair2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  
  if (!initArrayBuffer(gl, 'a_Color', colorBody, 3, gl.FLOAT)) return -1;
  g_modelMatrix.translate(robotXtranslate, g_jumpP, robotZtranslate);
  
  g_modelMatrix.rotate(g_robotAngle, 0.0, 1.0, 0.0);  // Rotate around the y-axis
  drawSegment(gl, n, g_bodyBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

  if (!initArrayBuffer(gl, 'a_Color', colorORANGE, 3, gl.FLOAT)) return -1;
  drawSegment(gl, n, g_neckBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  
  pushMatrix(g_modelMatrix);
  g_modelMatrix.rotate(g_headAngle, 0.0, 1.0, 0.0);  // Rotate around the y-axis
  drawSegment(gl, n, g_headBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  drawSegment(gl, n, g_earBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  if (!initArrayBuffer(gl, 'a_Color', colorFoot, 3, gl.FLOAT)) return -1;  //black color
  g_modelMatrix.translate(0.35, 10.1, 0.9);
  g_modelMatrix.scale(0.2, 0.2, 0.2);
  drawSegment(gl, n, g_eyeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw left eye
  g_modelMatrix.translate(-3.35, 0.0, 0.0);
  drawSegment(gl, n, g_eyeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw right eye
  if (!initArrayBuffer(gl, 'a_Color', colorRED, 3, gl.FLOAT)) return -1;  //red color
  g_modelMatrix.translate(1.35, -4.0, 0.0);
  drawSegment(gl, n, g_eyeBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw mouth
  g_modelMatrix = popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', colorLeg, 3, gl.FLOAT)) return -1;
  pushMatrix(g_modelMatrix);
  g_modelMatrix.rotate(g_leg1Angle, 1.0, 0.0, 0.0);  // Rotate around the x-axis
  drawSegment(gl, n, g_leg1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(0.75, -6.75, -0.5);
  g_modelMatrix.rotate(g_jumpP*5, 1.0, 0.0, 0.0);
  if (!initArrayBuffer(gl, 'a_Color', colorFoot, 3, gl.FLOAT)) return -1;
  drawSegment(gl, n, g_foot1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', colorLeg, 3, gl.FLOAT)) return -1;
  pushMatrix(g_modelMatrix);
  g_modelMatrix.rotate(g_leg2Angle, 1.0, 0.0, 0.0);  // Rotate around the x-axis
  drawSegment(gl, n, g_leg2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix.translate(-0.75, -6.75, -0.5);
  if (!initArrayBuffer(gl, 'a_Color', colorFoot, 3, gl.FLOAT)) return -1;
  g_modelMatrix.rotate(g_jumpP*5, 1.0, 0.0, 0.0);
  drawSegment(gl, n, g_foot2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
  
  if (!initArrayBuffer(gl, 'a_Color', colorORANGE, 3, gl.FLOAT)) return -1;
  // Arm1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.5, 8.0, 0.0); 
  g_modelMatrix.rotate(g_arm1xAngle, 1.0, 0.0, 0.0);  // Rotate around the x-axis
  g_modelMatrix.rotate(g_arm1zAngle, 0.0, 0.0, 1.0);  // Rotate around the z-axis
  g_modelMatrix.rotate(-g_jumpP*5, 0.0, 0.0, 1.0);
  drawSegment(gl, n, g_arm1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
  
  // Arm2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-1.5, 8.0, 0.0); 
  g_modelMatrix.rotate(g_arm2xAngle, 1.0, 0.0, 0.0);  // Rotate around the x-axis
  g_modelMatrix.rotate(g_arm2zAngle, 0.0, 0.0, 1.0);  // Rotate around the z-axis
  g_modelMatrix.rotate(g_jumpP*5, 0.0, 0.0, 1.0);
  drawSegment(gl, n, g_arm2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw
  g_modelMatrix = popMatrix();
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// Draw segments
function drawSegment(gl, n, buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // Assign the buffer object to the attribute variable
  gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_Position);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
  // Calculate matrix for normal and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

// Rotation angle (degrees/second)
var ANGLE_STEP1 = 30.0;
// Last time that this function was called
var g_last = Date.now();

var arabaDest = 1;
var arabaRotate = 0;
var g_arabaX = 0.0;
var g_arabaRotY = 0.0;
var g_arabaSTEP = 0.6;

function animate(angle) {
  // Calculate the elapsed time
  if(g_jumpP < g_jumpM && g_jumpM > 0.0){
	  g_jumpP+=2*g_jumpStep;
  }
  else if(g_jumpP > g_jumpM && g_jumpM > 0.0){
	  g_jumpM=0.0;
  }
  
  if((g_jumpP > g_jumpM) && (g_jumpM == 0.0)){
	  g_jumpP = g_jumpP - 2*g_jumpStep ;
  }
  else if (g_jumpP < g_jumpM && g_jumpM == 0.0 && g_jumpStep!=0.0){
	  g_jumpP = g_jumpP + g_jumpStep + g_jumpStep/2;
	  g_jumpStep=0.0;
  }
  
  if(g_arabaX<40 && arabaDest == 1){
	  g_arabaX += g_arabaSTEP;
  }
  else if (arabaDest == 1){
	  arabaDest = 0;
	  arabaRotate = 1;
  }
  
  if(g_arabaX>=-40 && arabaDest == -1){
	  g_arabaX -= g_arabaSTEP;
  }else if (arabaDest == -1){
	  arabaDest = 0;
	  arabaRotate = -1;
  }
  
  
  if(g_arabaRotY > -180 && arabaRotate == -1){
	  g_arabaRotY -= g_arabaSTEP*4;
  }else if (arabaRotate == -1 ){
	  arabaRotate = 0;
	  arabaDest = 1;
	  g_arabaRotY = 0 ;
  }
  
  if(g_arabaRotY < 180 && arabaRotate == 1){
	  g_arabaRotY += g_arabaSTEP*4;
  }else if (arabaRotate == 1 ){
	  arabaRotate = 0;
	  arabaDest = -1;
	  g_arabaRotY = 0 ;
  }

  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP1 * elapsed) / 1000.0;
  return newAngle %= 360;
}

function initArrayBufferForLaterUse(gl, data, num, type){
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initArrayBuffer(gl, attribute, data, num, type){
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);
  //gl.deleteBuffer(buffer);
  return true;
}