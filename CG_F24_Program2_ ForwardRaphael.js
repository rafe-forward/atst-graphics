"use strict";

var cylinderLandscape = function() {

    var canvas;
    var gl;

    // Cam params
    var cameraX = 2.4;
    var cameraY = 2.5;
    var cameraZ = 5.0;
    //angle the blasters are on, changed by slider
    var blasterAngle = 0; 

    //position of the light, change by slider
    var lightX = 6.4;
    var lightY = -6.0;
    var lightZ = 2.0;
    
    var nRows = 50;      // Number of divisions along the height
    var nColumns = 50;   // Number of divisions around the circumference
    //whether the at-at is going forward or backwards
    var goFwd = false;
    var goBack = false;
    var positionsArray = [];
    var colorsArray = [];
    var normalsArray = [];


    var near = -10;
    var far = 10;
    var left = -3.0;
    var right = 3.0;
    var top = 3.0;
    var bottom = -3.0;

    var rotationAngle = 0.0;  

    var modelViewMatrix, projectionMatrix;
    var modelViewMatrixLoc, projectionMatrixLoc;
    var normalMatrixLoc;
    var stack = [];

    
    var lightPosition = vec4(lightX, lightY, lightZ, 1.0);
    var lightAmbient = vec4(0.9, 0.9, 0.9, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    var lightSpecular = vec4(0.5, 0.5, 0.5, 1.0);

    //lighting for ice blue land
    var materialAmbient = vec4(0.5, 0.6, 0.7, 1.0);   
    var materialDiffuse = vec4(0.7, 0.9, 1.0, 1.0);    
    var materialSpecular = vec4(0.5, 0.5, 0.5, 1.0);   
    var materialShininess = 10.0; 

    var ambientProduct, diffuseProduct, specularProduct;


    var atatMaterialAmbient = vec4(0.2, 0.2, 0.2, 1.0);   
    var atatMaterialDiffuse = vec4(0.5, 0.5, 0.5, 1.0);    
    var atatMaterialSpecular = vec4(0.7, 0.7, 0.7, 1.0);   
    var atatMaterialShininess = 30.0;

    var atatAmbientProduct = mult(lightAmbient, atatMaterialAmbient);
    var atatDiffuseProduct = mult(lightDiffuse, atatMaterialDiffuse);
    var atatSpecularProduct = mult(lightSpecular, atatMaterialSpecular);

    //prog 1 is the "landscape" 2 is the at-at
    var program1, program2;


    var position2Buffer, color2Buffer, normal2Buffer, indexBuffer;
    var prog2VertexPositions, prog2VertexColors, prog2Normals, prog2Indices;

    var program2_positionLoc, program2_colorLoc, program2_normalLoc;


    var normalLoc, positionLoc, colorLoc;


    var program2_modelViewMatrixLoc, program2_projectionMatrixLoc, program2_normalMatrixLoc;


    var vao1, vao2;

    //angles for walking
    var leftLegAngle = 0;
    var rightLegAngle = 0;
    var legAngleIncrement = 1.0;  
    var yVal = 1.2; 

    var bodyWidth = 0.5;
    var bodyHeight = 0.7;
    var bodyDepth = 0.5;
    var blasterWidth = 0.1;
    var blasterHeight = 0.1;
    var blasterDepth = .5;

    var legWidth = 0.1;
    var legHeight = 1; 
    var legDepth = 0.1;


    var bodyCube;
    var legCube;
    var blasterCube;
    //wasnt working in mvnew
    function normalMatrix(m, flag) {
        var a = inverse(transpose(m));
        if (arguments.length === 1 && flag === false) return a;

        var b = mat3();
        for (var i = 0; i < 3; i++) 
            for (var j = 0; j < 3; j++) 
                b[i][j] = a[i][j];

        return b;
    }
    function calculateNormal(p1, p2, p3) {
        //console.log(p1);
        var U = subtract(vec4(p2), vec4(p1));
        var V = subtract(vec4(p3), vec4(p1));
        console.log(U);
        console.log(V);
        var normal = cross(U, V);
        return normalize(normal);
    }
    init();

    // generate mesh
    function generateCylinderMesh() {
        var width = 6.0;
        var depth = 6.0;
    
        var data = [];
    
        // Generate verts
        for (var i = 0; i <= nRows; ++i) {
            var x = -width / 2 + (i / nRows) * width; 
            data.push([]);
    
            for (var j = 0; j <= nColumns; ++j) {
                var z = -depth / 2 + (j / nColumns) * depth;
    
                // random height varience
                var y = -.1 + ((Math.random() -.5) /5) ;
    

                var position = vec4(y + 1, x, z, 1.0);
                data[i].push(position);
            }
        }
    
       //connect the verts
        for (var i = 0; i < nRows; i++) {
            for (var j = 0; j < nColumns; j++) {

                var a = data[i][j];
                var b = data[i + 1][j];
                var c = data[i + 1][j + 1];
                var d = data[i][j + 1];
                positionsArray.push(a);
                positionsArray.push(b);
                positionsArray.push(c);
    

                positionsArray.push(a);
                positionsArray.push(c);
                positionsArray.push(d);
    

                var normal1 = calculateNormal(a, b, c);
                var normal2 = calculateNormal(a, c, d);
                //console.log(normal1);
    
                // Add normals for each vertex
                normalsArray.push(normal1);
                normalsArray.push(normal1);
                normalsArray.push(normal1);
    
                normalsArray.push(normal2);
                normalsArray.push(normal2);
                normalsArray.push(normal2);
    
                // Add colors for each vertex
                const groundColor = vec4(0.6, 0.75, .9, 1.0); // Blue color for the ground
    
                colorsArray.push(groundColor);
                colorsArray.push(groundColor);
                colorsArray.push(groundColor);
    
                colorsArray.push(groundColor);
                colorsArray.push(groundColor);
                colorsArray.push(groundColor);
            }
        }
        //console.log(normalsArray);
    }

    function createCube(width, height, depth, blast) {
        var w = width / 2;
        var h = height / 2;
        var d = depth / 2;

        var vertices = [

            -w, -h,  d, 1.0,
             w, -h,  d, 1.0,
             w,  h,  d, 1.0,
            -w,  h,  d, 1.0,

            -w, -h, -d, 1.0,
            -w,  h, -d, 1.0,
             w,  h, -d, 1.0,
             w, -h, -d, 1.0,

            -w,  h, -d, 1.0,
            -w,  h,  d, 1.0,
             w,  h,  d, 1.0,
             w,  h, -d, 1.0,

            -w, -h, -d, 1.0,
             w, -h, -d, 1.0,
             w, -h,  d, 1.0,
            -w, -h,  d, 1.0,

             w, -h, -d, 1.0,
             w,  h, -d, 1.0,
             w,  h,  d, 1.0,
             w, -h,  d, 1.0,

            -w, -h, -d, 1.0,
            -w, -h,  d, 1.0,
            -w,  h,  d, 1.0,
            -w,  h, -d, 1.0,
        ];

        // Normals per face
        var normals = [

            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
        ];


        var indices = [

            0, 1, 2,    0, 2, 3,
            4, 5, 6,    4, 6, 7,
            8, 9,10,    8,10,11,
           12,13,14,   12,14,15,
           16,17,18,   16,18,19,
           20,21,22,   20,22,23
        ];

        return { vertices: vertices, normals: normals, indices: indices };
    }

    function init() {

        canvas = document.getElementById("gl-canvas");

        gl = canvas.getContext('webgl2');
        if (!gl) alert("WebGL 2.0 isn't available");


        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Generate the mesh
        generateCylinderMesh();


        //ground stuff
        var vertElem1 = document.getElementById("vertex-shader-1");
        var vertShdr1 = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShdr1, vertElem1.textContent.trim());
        gl.compileShader(vertShdr1);

        var fragElem1 = document.getElementById("fragment-shader-1");
        var fragShdr1 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShdr1, fragElem1.textContent.trim());
        gl.compileShader(fragShdr1);

        program1 = gl.createProgram();
        gl.attachShader(program1, vertShdr1);
        gl.attachShader(program1, fragShdr1);
        gl.linkProgram(program1);

        //at-at stuff
        var vertElem2 = document.getElementById("vertex-shader-2");
        var vertShdr2 = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShdr2, vertElem2.textContent.trim());
        gl.compileShader(vertShdr2);

        // Check for vertex shader 2 compilation errors
        if (!gl.getShaderParameter(vertShdr2, gl.COMPILE_STATUS)) {
            console.error('Vertex shader 2 failed to compile:', gl.getShaderInfoLog(vertShdr2));
            return;
        }

        var fragElem2 = document.getElementById("fragment-shader-2");
        var fragShdr2 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShdr2, fragElem2.textContent.trim());
        gl.compileShader(fragShdr2);

        // Check for fragment shader 2 compilation errors
        if (!gl.getShaderParameter(fragShdr2, gl.COMPILE_STATUS)) {
            console.error('Fragment shader 2 failed to compile:', gl.getShaderInfoLog(fragShdr2));
            return;
        }

        program2 = gl.createProgram();
        gl.attachShader(program2, vertShdr2);
        gl.attachShader(program2, fragShdr2);
        gl.linkProgram(program2);

        // Check for program2 linking errors
        if (!gl.getProgramParameter(program2, gl.LINK_STATUS)) {
            console.error('Program2 failed to link:', gl.getProgramInfoLog(program2));
            return;
        }

        // Calculate ambient, diffuse, and specular for the landscape
        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);

        // Use program1 
        gl.useProgram(program1);

        // Create and bind VAO1
        vao1 = gl.createVertexArray();
        gl.bindVertexArray(vao1);

        var nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

        normalLoc = gl.getAttribLocation(program1, "aNormal");
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);

        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

        positionLoc = gl.getAttribLocation(program1, "aPosition");
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

        colorLoc = gl.getAttribLocation(program1, "aColor");
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

        // Get uniform locations
        modelViewMatrixLoc = gl.getUniformLocation(program1, "uModelViewMatrix");
        projectionMatrixLoc = gl.getUniformLocation(program1, "uProjectionMatrix");
        normalMatrixLoc = gl.getUniformLocation(program1, "uNormalMatrix");


        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);
        
        gl.uniform4fv(gl.getUniformLocation(program1, "uAmbientProduct"), flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(program1, "uDiffuseProduct"), flatten(diffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(program1, "uSpecularProduct"), flatten(specularProduct));
        gl.uniform4fv(gl.getUniformLocation(program1, "uLightPosition"), flatten(lightPosition));
        gl.uniform1f(gl.getUniformLocation(program1, "uShininess"), materialShininess);


        gl.bindVertexArray(null);


        bodyCube = createCube(bodyWidth, bodyHeight, bodyDepth,false);
        legCube = createCube(legWidth, legHeight, legDepth,false);
        blasterCube = createCube(blasterWidth, blasterHeight, blasterDepth,true);

        prog2VertexPositions = [];
        prog2VertexColors = [];
        prog2Normals = [];
        prog2Indices = [];



        //add the body cube vertices to the big vertices list
        //then add the left leg, right leg, left blaster, right blaster
        prog2VertexPositions = prog2VertexPositions.concat(bodyCube.vertices);
        prog2Normals = prog2Normals.concat(bodyCube.normals);
        for (var i = 0; i < bodyCube.vertices.length / 4; i++) {
            if(i== bodyCube.vertices.length/4 - 8){
                prog2VertexColors.push(1.0, 0.3, 0.3, 1.0);
            }
            else{
                prog2VertexColors.push(0.3, 0.3, 0.3, 1.0); // Gray body color
            }
        }
        prog2Indices = prog2Indices.concat(bodyCube.indices);

        // Left Leg vertices normals and colors
        var leftLegOffset = prog2VertexPositions.length / 4;
        prog2VertexPositions = prog2VertexPositions.concat(legCube.vertices);
        prog2Normals = prog2Normals.concat(legCube.normals);
        for (var i = 0; i < legCube.vertices.length / 4; i++) {
            prog2VertexColors.push(0.3, 0.3, 0.3, 1.0); 
        }
        //add little offset
        var adjustedIndices = legCube.indices.map(function(index) {
            return index + leftLegOffset;
        });
        prog2Indices = prog2Indices.concat(adjustedIndices);


        var rightLegOffset = prog2VertexPositions.length / 4;
        prog2VertexPositions = prog2VertexPositions.concat(legCube.vertices);
        prog2Normals = prog2Normals.concat(legCube.normals);
        for (var i = 0; i < legCube.vertices.length / 4; i++) {
            prog2VertexColors.push(0.3, 0.3, 0.3, 1.0); //  leg color
        }
        // Add little offset
        adjustedIndices = legCube.indices.map(function(index) {
            return index + rightLegOffset;
        });
        prog2Indices = prog2Indices.concat(adjustedIndices);

        // Left Blaster vertices, normals, and colors
        var leftBlasterOffset = prog2VertexPositions.length / 4;
        prog2VertexPositions = prog2VertexPositions.concat(blasterCube.vertices);
        prog2Normals = prog2Normals.concat(blasterCube.normals);
        for (var i = 0; i < blasterCube.vertices.length / 4; i++) {
            prog2VertexColors.push(1.0, 0.3, 0.3, 1.0); // Blaster color
        }
        // Adjust indices
        adjustedIndices = blasterCube.indices.map(function(index) {
            return index + leftBlasterOffset;
        });
        prog2Indices = prog2Indices.concat(adjustedIndices);

        // Right Blaster vertices, normals, and colors
        var rightBlasterOffset = prog2VertexPositions.length / 4;
        prog2VertexPositions = prog2VertexPositions.concat(blasterCube.vertices);
        prog2Normals = prog2Normals.concat(blasterCube.normals);
        for (var i = 0; i < blasterCube.vertices.length / 4; i++) {
            prog2VertexColors.push(0.3, 0.3, 0.3, 1.0); // Blaster color
        }
        // Adjust indices
        adjustedIndices = blasterCube.indices.map(function(index) {
            return index + rightBlasterOffset;
        });
        prog2Indices = prog2Indices.concat(adjustedIndices);
        //convert
        prog2VertexPositions = new Float32Array(prog2VertexPositions);
        prog2VertexColors = new Float32Array(prog2VertexColors);
        prog2Normals = new Float32Array(prog2Normals);
        prog2Indices = new Uint16Array(prog2Indices);

        // Make tje buffers
        position2Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, position2Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, prog2VertexPositions, gl.STATIC_DRAW);

        color2Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, color2Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, prog2VertexColors, gl.STATIC_DRAW);

        normal2Buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normal2Buffer);
        gl.bufferData(gl.ARRAY_BUFFER, prog2Normals, gl.STATIC_DRAW);

        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, prog2Indices, gl.STATIC_DRAW);

        gl.useProgram(program2);


        program2_positionLoc = gl.getAttribLocation(program2, 'position');
        program2_colorLoc = gl.getAttribLocation(program2, 'color');
        program2_normalLoc = gl.getAttribLocation(program2, 'aNormal');


        program2_modelViewMatrixLoc = gl.getUniformLocation(program2, "uModelViewMatrix");
        program2_projectionMatrixLoc = gl.getUniformLocation(program2, "uProjectionMatrix");
        program2_normalMatrixLoc = gl.getUniformLocation(program2, "uNormalMatrix");


        vao2 = gl.createVertexArray();
        gl.bindVertexArray(vao2);


        gl.bindBuffer(gl.ARRAY_BUFFER, position2Buffer);
        gl.vertexAttribPointer(program2_positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program2_positionLoc);


        gl.bindBuffer(gl.ARRAY_BUFFER, color2Buffer);
        gl.vertexAttribPointer(program2_colorLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program2_colorLoc);


        gl.bindBuffer(gl.ARRAY_BUFFER, normal2Buffer);
        gl.vertexAttribPointer(program2_normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program2_normalLoc);


        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.uniform4fv(gl.getUniformLocation(program2, "uAmbientProduct"), flatten(atatAmbientProduct));
        gl.uniform4fv(gl.getUniformLocation(program2, "uDiffuseProduct"), flatten(atatDiffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(program2, "uSpecularProduct"), flatten(atatSpecularProduct));
        gl.uniform4fv(gl.getUniformLocation(program2, "uLightPosition"), flatten(lightPosition));
        gl.uniform1f(gl.getUniformLocation(program2, "uShininess"), atatMaterialShininess);


        gl.bindVertexArray(null);

        var audioPlaying = false;
        var audio = new Audio('wars.mp3');
        document.getElementById("Music").onclick = function() {
            if (!audioPlaying) {
                audioPlaying = true;
                audio.play();
            }
            else{
                audioPlaying = false;
                audio.pause();
            }
        };
        document.getElementById("lightXSlider").addEventListener("input", function(event) {
            lightX = parseFloat(event.target.value);
            document.getElementById("lightXValue").textContent = lightX.toFixed(1);
            updateLight();
        });
        
        document.getElementById("lightYSlider").addEventListener("input", function(event) {
            lightY = parseFloat(event.target.value);
            document.getElementById("lightYValue").textContent = lightY.toFixed(1);
            updateLight();
        });
        
        document.getElementById("lightZSlider").addEventListener("input", function(event) {
            lightZ = parseFloat(event.target.value);
            document.getElementById("lightZValue").textContent = lightZ.toFixed(1);
            updateLight();
        });

        function updateLight() {
            lightPosition = vec4(lightX, lightY, lightZ, 1.0);
        }
        document.getElementById("blasterSlider").addEventListener("input", function(event) {
            blasterAngle = parseFloat(event.target.value);
            document.getElementById("blasterSliderVal").textContent = blasterAngle.toFixed(1);
        });
        document.getElementById("sliderX").addEventListener("input", function(event) {
            cameraX = parseFloat(event.target.value);
            document.getElementById("sliderXValue").textContent = cameraX.toFixed(1);
        });

        document.getElementById("sliderY").addEventListener("input", function(event) {
            cameraY = parseFloat(event.target.value);
            document.getElementById("sliderYValue").textContent = cameraY.toFixed(1);
        });

        document.getElementById("sliderZ").addEventListener("input", function(event) {
            cameraZ = parseFloat(event.target.value);
            document.getElementById("sliderZValue").textContent = cameraZ.toFixed(1);
            
        });
        //code for button presses
        /*                                 /
        /        Button Controls           /
        /        w - move forward          /
        /        s - move backwards        /
        /        r - move blasters up      /
        /        f - move blasters down    /
        /        q - stop moving           /
        /                                 */
        document.addEventListener('keydown', function(e){
            if(e.key == "w"){
                goBack = false;
                goFwd = true;
            }
            if(e.key == "s"){
                goBack = true;
                goFwd = false;
            }
            if(e.key == "q"){
                goBack = false;
                goFwd = false;
            }
            if(e.key == "r"){
                blasterAngle += 5;
            }
            if(e.key=="f"){
                blasterAngle -= 5;
            }
         })
        render();
    }

    var movingForwardInc = 0.0;

    function drawBody() {
        stack.push(modelViewMatrix);

        modelViewMatrix = mult(modelViewMatrix, translate(0.0, 0.5 - yVal, movingForwardInc));

        var iMatrix = mat4(); // Identity matrix
        var t = mult(modelViewMatrix, iMatrix);
        gl.uniformMatrix4fv(program2_modelViewMatrixLoc, false, flatten(t));


        var normalMatrixComputed = normalMatrix(modelViewMatrix, true);
        gl.uniformMatrix3fv(program2_normalMatrixLoc, false, flatten(normalMatrixComputed));

        // Draw body cube
        gl.drawElements(gl.TRIANGLES, bodyCube.indices.length, gl.UNSIGNED_SHORT, 0);

        modelViewMatrix = stack.pop();
    }

    // draw the left leg
    function drawLeftLeg() {
        stack.push(modelViewMatrix);

        var legOffsetX = -(bodyWidth / 2 + legWidth / 2);
        var legAttachmentY = (0.5 - yVal) - (bodyHeight / 2);
        modelViewMatrix = mult(modelViewMatrix, translate(legOffsetX, legAttachmentY, movingForwardInc));
        modelViewMatrix = mult(modelViewMatrix, rotateX(leftLegAngle));

        modelViewMatrix = mult(modelViewMatrix, translate(0.0, -legHeight / 2, 0.0));

        var instanceMatrix = mat4(); // Identity matrix
        var t = mult(modelViewMatrix, instanceMatrix);
        gl.uniformMatrix4fv(program2_modelViewMatrixLoc, false, flatten(t));


        var normalMatrixComputed = normalMatrix(modelViewMatrix, true);
        gl.uniformMatrix3fv(program2_normalMatrixLoc, false, flatten(normalMatrixComputed));


        var offset = bodyCube.indices.length * 2; 

        gl.drawElements(gl.TRIANGLES, legCube.indices.length, gl.UNSIGNED_SHORT, offset);

        modelViewMatrix = stack.pop();
    }


    function drawRightLeg() {
        stack.push(modelViewMatrix);


        var legOffsetX = (bodyWidth / 2 + legWidth / 2);
        var legAttachmentY = (0.5 - yVal) - (bodyHeight / 2);
        modelViewMatrix = mult(modelViewMatrix, translate(legOffsetX, legAttachmentY, movingForwardInc));
        modelViewMatrix = mult(modelViewMatrix, rotateX(rightLegAngle));

        modelViewMatrix = mult(modelViewMatrix, translate(0.0, -legHeight / 2, 0.0));

        var iMatrix = mat4(); // Identity matrix
        var t = mult(modelViewMatrix, iMatrix);
        gl.uniformMatrix4fv(program2_modelViewMatrixLoc, false, flatten(t));


        var normalMatrixComputed = normalMatrix(modelViewMatrix, true);
        gl.uniformMatrix3fv(program2_normalMatrixLoc, false, flatten(normalMatrixComputed));


        var offset = (bodyCube.indices.length + legCube.indices.length) * 2; // 2 bytes per index

        gl.drawElements(gl.TRIANGLES, legCube.indices.length, gl.UNSIGNED_SHORT, offset);

        modelViewMatrix = stack.pop();
    }
    function drawLeftBlaster() {
        stack.push(modelViewMatrix);
    

        var blasterOffsetX = -(bodyWidth / 2 + blasterWidth / 2);
        var blasterAttachmentY = (0.5 - yVal - 0.5) + (bodyHeight / 2) - (blasterHeight / 2);
        modelViewMatrix = mult(modelViewMatrix, translate(blasterOffsetX, blasterAttachmentY, 0.15 + movingForwardInc));
    

        modelViewMatrix = mult(modelViewMatrix, rotateX(blasterAngle));
    
        var iMatrix = mat4(); // Identity matrix
        var t = mult(modelViewMatrix, iMatrix);
        gl.uniformMatrix4fv(program2_modelViewMatrixLoc, false, flatten(t));
    

        var normalMatrixComputed = normalMatrix(modelViewMatrix, true);
        gl.uniformMatrix3fv(program2_normalMatrixLoc, false, flatten(normalMatrixComputed));
    

        var offset = (bodyCube.indices.length + 2 * legCube.indices.length) * 2; 
    
        gl.drawElements(gl.TRIANGLES, blasterCube.indices.length, gl.UNSIGNED_SHORT, offset);
    
        modelViewMatrix = stack.pop();
    }
    
    function drawRightBlaster() {
        stack.push(modelViewMatrix);
    

        var blasterOffsetX = (bodyWidth / 2 + blasterWidth / 2);
        var blasterAttachmentY = (0.5 - yVal - 0.5) + (bodyHeight / 2) - (blasterHeight / 2);
        modelViewMatrix = mult(modelViewMatrix, translate(blasterOffsetX, blasterAttachmentY, 0.15 + movingForwardInc));
    

        modelViewMatrix = mult(modelViewMatrix, rotateX(blasterAngle));
    
        var iMatrix = mat4(); // Identity matrix
        var t = mult(modelViewMatrix, iMatrix);
        gl.uniformMatrix4fv(program2_modelViewMatrixLoc, false, flatten(t));
    

        var normalMatrixComputed = normalMatrix(modelViewMatrix, true);
        gl.uniformMatrix3fv(program2_normalMatrixLoc, false, flatten(normalMatrixComputed));
    

        var offset = (bodyCube.indices.length + 2 * legCube.indices.length + blasterCube.indices.length) * 2; 
    
        gl.drawElements(gl.TRIANGLES, blasterCube.indices.length, gl.UNSIGNED_SHORT, offset);
    
        modelViewMatrix = stack.pop();
    }
    
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //simulates walking motion -- one leg goes forward one leg goes back
        if (rightLegAngle > 30 || rightLegAngle < -30) {
            legAngleIncrement =- legAngleIncrement;
        }
        if(goFwd){
            
            leftLegAngle += legAngleIncrement;
            rightLegAngle -= legAngleIncrement;
        }
        if(goBack){
            
            leftLegAngle -= legAngleIncrement;
            rightLegAngle += legAngleIncrement;
        }

        
        var eye = vec3(cameraX, cameraY, cameraZ);
        var at = vec3(0.0, 0.0, 0.0);
        var up = vec3(0.0, 1.0, 0.0);


        var viewMatrix = lookAt(eye, at, up);


        var projectionMatrix = ortho(left, right, bottom, top, near, far);

        // Use program1 for the landscape
        gl.useProgram(program1);
        gl.bindVertexArray(vao1);

        gl.uniform4fv(gl.getUniformLocation(program1, "uLightPosition"), flatten(lightPosition));
        modelViewMatrix = mult(viewMatrix, translate(0, -3, 0));
        modelViewMatrix = mult(modelViewMatrix, rotateX(rotationAngle));
        modelViewMatrix = mult(modelViewMatrix, rotateZ(90));

        var normalMatrixComputed = normalMatrix(modelViewMatrix, true);


        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrixComputed));


        gl.drawArrays(gl.TRIANGLES, 0, positionsArray.length);


        gl.useProgram(program2);
        gl.bindVertexArray(vao2);
        gl.uniform4fv(gl.getUniformLocation(program2, "uLightPosition"), flatten(lightPosition));

        gl.uniformMatrix4fv(program2_projectionMatrixLoc, false, flatten(projectionMatrix));


        modelViewMatrix = viewMatrix;
        if(goFwd){
            movingForwardInc += .01;
        }
        if(goBack){
            movingForwardInc -= .01;
        }
        if(movingForwardInc == 3){
            movingForwardInc = -.01;
        }
        if(movingForwardInc == -3){
            movingForwardInc = .01;
        }
        drawBody();

        drawLeftLeg();


        drawRightLeg();
        drawLeftBlaster();

        drawRightBlaster();
        
        requestAnimationFrame(render);
    }

}

cylinderLandscape();
