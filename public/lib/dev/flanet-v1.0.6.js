/*

Flanet 1.0.5

Copyright (C) 2012 juwon.lee

MIT License

@dependency
   jquery 1.7.2
   kinetic 4.7.4
   box2d 0.2.0
*/

//Flanet Singleton
var Flanet = {
	// flanet world array
	worldArray : [],

	// physics engine iteration.
	iteration : 8,

	// animation step
	timestep : 1 / 60,

	// Kinetic stage
	stage : undefined,

	// animation instance
	animation : undefined,

	animation_extra : undefined,

	// initialize
	init : function(json){
		var that = this;
		var queryContainer = $("#" + json.container);

		this.stage = new Kinetic.Stage({
			container : json.container,
			width : queryContainer.width(),
			height : queryContainer.height()
		});

		// html container mouseEvent binding
		queryContainer.mousemove(function(e){
			Flanet.mouseEvent.mousemove(e);
		});
		queryContainer.click(function(e){
			Flanet.mouseEvent.click(e);
		});
		queryContainer.mousedown(function(e){
			Flanet.mouseEvent.mousedown(e);
		});
		queryContainer.mouseup(function(e){
			Flanet.mouseEvent.mouseup(e);
		});

		// window event binding - resize
		$(window).resize(function(){
			console.log('viewsize : ' + window.width + 'x' + window.height);
			queryContainer.css({
				width : window.width + 'px',
				height: window.height + 'px'
			});
			that.stage.setSize(queryContainer.width(), queryContainer.height());
			that.stage.draw();
		});

		// set kintic stage animation timer
		// this.stage.onFrame(function(frame){
		// 	that.step();
		// });

		this.animation = new Kinetic.Animation(function(frame){
			that.step();
		}, that.stage.getLayer(0));
	},

	// thread management
	start : function(){
		if(this.animation)
			this.animation.start();
	},

	stop : function(){
		if(this.stage)
			this.stage.stop();
	},

	step : function(){
		for(var i = 0; i < this.worldArray.length; i++){
			var world = this.worldArray[i];
			if(world.getActivation()){
				world.step(this.timestep, this.iteration);
				/*if(world.getAvgSpeed() < 1 && !this.mouseEvent.drag)
					world.stop();*/
			}
		}
		if(this.animation_extra != undefined)
			this.animation_extra();
	},

	// world management
	addWorld : function(world){
		this.worldArray[this.worldArray.length] = world;
		this.stage.add(world.getLayer());
	},

	getWorld : function(v){
		for(var i = 0; i < this.worldArray.length; i++)
			if(this.worldArray[i].intersects(v))
				return this.worldArray[i];
			return undefined;
		},

		getCurrentWorld : function(){
			return this.mouseEvent.world;
		},

	// mouseEvent module
	mouseEvent : {
		// mouse status check
		drag : false,
		moved : false,

		// Panel object
		panel : undefined,

		// physics event
		mPos : new b2Vec2(0, 0),
		mJoint : undefined,
		body : undefined,
		world : undefined,
		mousedown : function(e){
			this.drag = true;
			this.moved = false;
			if(Flanet.getWorld(this.mPos))
				this.world = Flanet.getWorld(this.mPos);
			if(this.world){
				this.body = this.world.getBody(this.mPos);
				if(this.world.getAvgSpeed() < 1)
					this.world.wakeUp();
			}
		},
		mouseup : function(e){
			if(this.mJoint) {
				this.world.getWorld().DestroyJoint(this.mJoint);
				this.mJoint = undefined;
			}
			this.drag = false;
		},
		dblclick : function(e){
		},
		click : function(e){
			if(this.world){
				var pos = this.mPos;
				if(!this.drag){
					if(this.world.intersects(pos)){
						this.body = this.world.getBody(this.mPos);
						var idx = this.world.getIndex(this.body);
						if(idx == -1)
							this.panel = this.world.getCenterPanel();
						else
							this.panel = this.world.getPanel(idx);
						if(this.panel){
							if(!this.moved){
								// panel click event
								this.panel.clicked();
							} else {
								// panel drag out event
								this.panel.dragged();
							}
						}
					}
				}
			} else {
				// space click event
			}
		},
		mouseover : function(e){
		},
		mouseout : function(e){
		},
		mousemove : function(e){
			this.moved = true;
			this.mPos.Set(e.clientX, e.clientY);
			if(this.world){
				if(this.drag)
					this.mousedrag(e);
				else{
					if(this.body)
						this.mouseover(e);
					else
						this.mouseout(e);
				}
			}
		},
		mousedrag : function(e){
			if(this.world.getAvgSpeed() < 1)
				this.world.wakeUp();
			if(this.body){
				var md = new b2MouseJointDef();
				md.body1 = this.world.getWorld().m_groundBody;
				md.body2 = this.body;
				md.target.Set(this.mPos.x, this.mPos.y);
				md.maxForce = 100000000000 * this.body.m_mass;
				md.timeStep = Flanet.timestep;
				if(!this.mJoint)
					this.mJoint = this.world.getWorld().CreateJoint(md);
				if(this.world.getIndex(this.body) == -1)
					this.world.setCentroid(this.mPos);
				this.body.WakeUp();
			}
			if(this.mJoint){
				var p2 = new b2Vec2(this.mPos.x, this.mPos.y);
				this.mJoint.SetTarget(p2);
			}
		}
	}
};

//Flanet Panel
Flanet.Panel = function(json){
	this.init(json);
};

Flanet.Panel.prototype = {

	pos : undefined,
	width : 0,
	height : 0,
	radius : 0,

	// canvas element
	image : undefined,
	text : undefined,

	// physics
	bodyDef : undefined,
	body : undefined,

	// panels information
	content : undefined,

	// default physics constant
	physics : {
		friction : 1,
		restitution : 0.5,
		density : 1,
		linearDamping : 0.05,
		angularDamping : 0.05
	},

	// initialize
	init : function(json){
		//position
		this.pos = new b2Vec2(json.x, json.y);
		this.rotation = 0;
		this.width = json.width;
		this.height = json.height;
		this.radius = Math.sqrt(this.width * this.width + this.height * this.height);
		this.content = new Flanet.Content(json.content);

		// physics body
		var boxSd = new b2BoxDef();
		this.bodyDef = new b2BodyDef();

		var body;
		if(json.body == undefined)
			body = this.physics;
		else
			body = json.body;
		boxSd.friction = body.friction;
		boxSd.restitution = body.restitution;
		boxSd.density = body.density;
		boxSd.extents.Set(this.width, this.height);

		this.bodyDef.AddShape(boxSd);

		this.bodyDef.linearDamping = body.linearDamping;
		this.bodyDef.angularDamping = body.angularDamping;
		this.bodyDef.position.Set(this.pos.x, this.pos.y);

		// kinetic image
		var img = new Image();
		img.src = this.content.getImgSrc();
		img.onload = this.setImage(img);
		this.setText(this.content.getName());
	},

	// set canvas image element
	setImage : function(img){
		var that = this;
		var sWidth = 10;
		this.image = new Kinetic.Image({
			x : that.pos.x,
			y : that.pos.y,
			width : that.width * 2 - sWidth,
			height : that.height * 2 - sWidth,
			fill : "#f8f8f8",
			image : img,
			// color code range #888 ~ #fff
			stroke : '#' + Math.floor(8947848 + Math.random() * 7829367).toString(16),
			strokeWidth : sWidth,
			draggable : false,
			listening : false
		});
		this.image.setOffsetX(that.width - sWidth * .5);
		this.image.setOffsetY(that.height - sWidth * .5);
	},
	getImage : function(){
		return this.image;
	},
	setText : function(text){
		var that = this;
		this.text = new Kinetic.Text({
			x : that.pos.x,
			y : that.pos.y,
			text : text,
			fontSize : 12,
			fontFamily : "Verdana",
			fill : "#222",
			listening : false,
			draggable : false
		});
		this.text.setOffsetX(this.width - 10);
		this.text.setAlign('center');
	},
	getText : function(){
		return this.text;
	},
	setBody : function(world){
		this.body = world.CreateBody(this.bodyDef);
	},
	getBody : function(){
		return this.body;
	},

	// update
	update : function(){
		if(this.body){
			this.pos.SetV(this.body.GetCenterPosition());
			this.image.setPosition(this.pos.x, this.pos.y);
			this.text.setPosition(this.pos.x, this.pos.y + this.height-20);
			this.image.setRotation(this.body.m_rotation);
		}
	},
	getWidth : function(){
		return this.width;
	},
	getHeight : function(){
		return this.height;
	},
	getPosition : function(){
		return this.pos;
	},
	getRadius : function(){
		return this.radius;
	},
	getRotation : function(){
		return this.body.m_rotation;
	},
	getVelocity : function(){
		return this.body.GetLinearVelocity();
	},
	getDistance : function(v){
		var d = b2Math.SubtractVV(this.getPosition(), v);
		return Math.sqrt(d.x * d.x + d.y * d.y);
	},
	setAlpha : function(a){
		this.image.setAlpha(a);
		this.text.setAlpha(a);
	},
	getContent : function(){
		return this.content;
	},
	clicked : function() {
		this.content.clicked();
	},
	dragged : function() {
		this.content.dragged();
	},
	dblclicked : function(){
		this.content.dblclicked();
	}
};

//Flanet World
Flanet.World = function(json){
	this.init(json);
};

Flanet.World.prototype = {
	// canvas size
	width : 0,
	height : 0,

	// physics world
	world : undefined,
	centerPanel : undefined,
	centroid : undefined,
	layer : undefined,
	panelArray : [],

	// limit boundary
	boundary : 10000,

	// gravity vector
	gravity : new b2Vec2(0, 0),

	// running status
	activation : true,

	//initialize
	init : function(json){
		this.panelArray = [];
		this.centroid = new b2Vec2(this.width / 2, this.height / 2);
		this.width = json.width;
		this.height = json.height;
		var worldAABB = new b2AABB();

		// physics boundary
		worldAABB.minVertex.Set(-this.boundary, -this.boundary);
		worldAABB.maxVertex.Set(this.width + this.boundary, this.height + this.boundary);

		// physics world init
		this.world = new b2World(worldAABB, this.gravity, true);

		// draw layer init
		this.layer = new Kinetic.Layer();
		this.setCenterPanel(json.centerPanel);
	},

	// get physical body
	getBody : function(v){
		// aabb : axis aligned bounding box
		var aabb = new b2AABB();
		var maxCount = 10;
		var shapes = [];
		var body = undefined;

		// make small aabb to contact check
		aabb.minVertex.Set(v.x - 1, v.y - 1);
		aabb.maxVertex.Set(v.x + 1, v.y + 1);

		// get contact query
		var count = this.world.Query(aabb, shapes, maxCount);
		for(var i = 0; i < count; ++i)
			if(!shapes[i].m_body.IsStatic())
				// get only one body
			if(shapes[i].TestPoint(v)){
				body = shapes[i].m_body;
				break;
			}
			return body;
		},

	// get body index
	getIndex : function(body){
		if(body == this.centerPanel.getBody())
			return -1;
		else
			for(var i = 0; i < this.panelArray.length; i++)
				if(body == this.panelArray[i].getBody())
					return i;
			},

	// world thread control
	start : function(){
		this.layer.draw();
		this.activation = true;
	},
	stop : function(){
		this.layer.draw();
		this.activation = false;
	},
	wakeUp : function(){
		for(var i = 0; i < this.panelArray.length; i++){
			var v = new b2Vec2(Math.random() * 2, Math.random() * 2);
			this.panelArray[i].getBody().SetLinearVelocity(v);
			this.panelArray[i].getBody().WakeUp();
		}
		this.start();
	},
	getActivation : function(){
		return this.activation;
	},
	step : function(timeStep, iteration){
		if(this.activation){
			for(var i = 0; i < this.panelArray.length; i++){
				var body = this.panelArray[i].getBody();

				// center panel has a gravity - panel direction is pointing centerpanel.
				var direction = b2Math.SubtractVV(this.centerPanel.getPosition()
					, body.GetCenterPosition());

				var scala = b2Math.MulFV(body.m_mass * 0.01 *
						this.getAltitute(this.panelArray[i].getPosition()), direction);
				
				// trim force amount
				scala = b2Math.b2Clamp(scala, 0.0, 5.0);

				// apply force to panel
				body.ApplyForce(scala, this.centerPanel.getPosition());

				this.panelArray[i].update();
			}

			// center panel's movement logic..
			var cb = this.centerPanel.getBody();
			var cd = b2Math.SubtractVV(this.centroid, cb.GetCenterPosition());
			cb.ApplyForce(
				b2Math.MulFV(cb.m_mass * this.centerPanel.getDistance(this.centroid), cd)
				, this.centroid);
			this.centerPanel.update();
			this.world.Step(timeStep, iteration);
			this.layer.draw();
		}
	},
	getLayer : function(){
		return this.layer;
	},
	getWorld : function(){
		return this.world;
	},

	// set world's center position
	setCentroid : function(v){
		this.centroid.x = v.x;
		this.centroid.y = v.y;
	},
	getCentroid : function(){
		return this.centroid;
	},

	// set flanet world's corePanel
	setCenterPanel : function(panel){
		this.layer.add(panel.getImage());
		this.layer.add(panel.getText());
		panel.setBody(this.world);
		panel.getBody().m_linearDamping = b2Math.b2Clamp(0.5, 0.0, 1.0);
		panel.getBody().m_angularDamping = b2Math.b2Clamp(0.3, 0.0, 1.0);
		this.centerPanel = panel;
		this.centroid.SetV(panel.getPosition());
	},
	getCenterPanel : function(){
		return this.centerPanel;
	},

	// get distance between core to point vector v.
	getAltitute : function(v){
		return this.centerPanel.getDistance(v);
	},
	addPanel : function(panel){
		this.layer.add(panel.getImage());
		this.layer.add(panel.getText());
		panel.setBody(this.world);
		var alt = this.getAltitute(panel.getPosition());
		this.panelArray[this.panelArray.length] = panel;
		if(this.getAvgSpeed() < 1)
			this.wakeUp();
	},
	getPanel : function(index){
		return this.panelArray[index];
	},
	getPanelById : function(id){
		for(var i = 0; i < this.panelArray.length; i++){
			var target = this.panelArray[i];
			if(target.getContent().getID() == id)
				return target;
		}
	},
	rmPanel : function(panel){
		this.world.DestroyBody(panel.getBody());
		this.layer.remove(panel.getImage());
		this.layer.remove(panel.getText());
		this.panelArray.splice(this.getIndex(panel.getBody()),0);
	},
	getAvgSpeed : function(){
		var s = 0;
		for(var i = 0; i < this.panelArray.length; i++){
			var v = this.panelArray[i].getVelocity();
			s += Math.sqrt(b2Math.b2Dot(v, v));
		}
		return s / this.panelArray.length;
	},
	intersects : function(v){
		if(this.getBody(v) != undefined){
			return true;
		}
	}
};

//Flanet Content
Flanet.Content = function(json){
	this.init(json);
};
Flanet.Content.prototype = {
	id : "",
	name : "",
	imgSrc : "",
	clicked : undefined,
	dragged : undefined,
	dblclicked : undefined,
	init : function(json){
		this.setID(json.id);
		this.setName(json.name);
		this.setImgSrc(json.imgSrc);
		this.setClicked(json.clicked);
		this.setDragged(json.dragged);
		this.setDblclicked(json.dblclicked);
	},
	setID : function(id){
		this.id = id;
	},
	getID : function(){
		return this.id;
	},
	setName : function(name){
		this.name = name;
	},
	getName : function(){
		return this.name;
	},
	setImgSrc : function(imgSrc){
		this.imgSrc = imgSrc;
	},
	getImgSrc : function(){
		return this.imgSrc;
	},
	// abstract method implementation
	setClicked : function(click){
		if(!click)
			this.clicked = function(){};
		else
			this.clicked = click;
	},
	setDragged : function(drag){
		if(!drag)
			this.dragged = function(){};
		else
			this.dragged = drag;
	},
	setDblclicked : function(dblclick){
		if(!dblclick)
			this.dblclicked = function(){};
		else
			this.dblclicked = dblclick;
	}
};
