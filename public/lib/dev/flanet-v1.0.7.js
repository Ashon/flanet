/*
 * Flanet v1.0.7
 * MIT Licensed.
 * Copyright (C) 2012 juwon.lee
 * 1.0.5 - release.
 * 1.0.6 - apply kineticjs 4.7.4
 * 1.0.7 - redesign flanet structure
 *
 * @dependency
 *   jquery 1.7.2
 *   kinetic 4.7.4
 *   box2d 0.2.0
 */

// simple flanet Singleton
var Flanet = {};

(function(){
	Flanet = {
		// physics engine iteration.
		iteration : 8,

		// animation step
		timestep : 1 / 60,
		
		// default physics constant
		physics : {
			friction : 1,
			restitution : 0.5,
			density : 1,
			linearDamping : 0.05,
			angularDamping : 0.05
		},

		// initialize
		init : function(s){
			// flanet stage
			this.stage = s;
		},

		// mouseEvent instance as a singleton
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
			bigScala : 100000000000,

			mousedown : function(e){
				this.drag = true;
				this.moved = false;
				this.world = Flanet.stage.getWorld(this.mPos);
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
							this.panel = idx == -1 ? this.world.getCenterPanel() :
							this.world.getPanel(idx);
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
					md.maxForce = this.bigScala * this.body.m_mass;
					md.timeStep = Flanet.timestep;
					if(this.mJoint === undefined)
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
})();

(function(){
	// Flanet.Collection constructor - array extension
	Flanet.Collection = function(){};
	Flanet.Collection.prototype = [];
	Flanet.Collection.prototype.get = function(idx){
		return this[idx];
	};
	// simple iterator - each(function, callback)
	Flanet.Collection.prototype.each = function(func, callback){
		for(var i = 0; i < this.length; i++)
			func(this[i], i);
		if(callback !== undefined)
			callback(this);
	};
})();

(function(){
	Flanet.Stage = function(json){
		var worlds = new Flanet.Collection();
		var that = this;
		var queryContainer = $("#" + json.container);

		// Kinetic Stage
		this.stage = new Kinetic.Stage({
			container : json.container,
			width : queryContainer.width(),
			height : queryContainer.height()
		});

		// mouseEvent binding
		queryContainer.mousemove(function(e){
			Flanet.mouseEvent.mousemove(e);
		}).click(function(e){
			Flanet.mouseEvent.click(e);
		}).mousedown(function(e){
			Flanet.mouseEvent.mousedown(e);
		}).mouseup(function(e){
			Flanet.mouseEvent.mouseup(e);
		});

		this.animation = new Kinetic.Animation(function(frame){ that.step(); },
			that.stage.getLayer(0));
	};
	Flanet.Stage.prototype = {
		// box2d world
		worlds : new Flanet.Collection(),

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
			this.worlds.each(function(world){
				if(world.getActivation())
					world.step(Flanet.timestep, Flanet.iteration);
				if(world.getAvgSpeed() < 1 && !Flanet.mouseEvent.drag)
					world.stop();
			});

			if(this.animation_extra !== undefined){
				this.animation_extra();
			}
		},

		// world management
		addWorld : function(world){
			this.worlds.push(world);
			this.stage.add(world.getLayer());
		},

		getWorld : function(v){
			var w;
			this.worlds.each(function(world){
				if(world.intersects(v))
					w = world;
			});
			if(w !== undefined)
				return w;
		}
	};
})();

(function(){
	//Flanet Panel
	Flanet.Panel = function(json){
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

		var body = json.body || Flanet.physics;

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
	};

	Flanet.Panel.prototype = {
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
			});
			this.image.setOffsetX(that.width - sWidth * 0.5);
			this.image.setOffsetY(that.height - sWidth * 0.5);
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
				this.text.setPosition(this.pos.x, this.pos.y + this.height - 20);
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
})();

(function(){
	//Flanet World
	Flanet.World = function(json){
		this.panels = new Flanet.Collection();
		this.centroid = new b2Vec2(this.width * 0.5, this.height * 0.5);
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
	};

	Flanet.World.prototype = {
		// limit boundary
		boundary : 10000,

		// gravity vector
		gravity : new b2Vec2(0, 0),

		// get physical body
		getBody : function(v){
			// aabb : axis aligned bounding box
			var aabb = new b2AABB();
			var maxCount = 10;
			var shapes = new Flanet.Collection();
			var body;

			// make small aabb to contact check
			aabb.minVertex.Set(v.x - 1, v.y - 1);
			aabb.maxVertex.Set(v.x + 1, v.y + 1);

			// get contact query
			var count = this.world.Query(aabb, shapes, maxCount);
			for(var i = 0; i < count; i++){
				if(!shapes[i].m_body.IsStatic() && shapes[i].TestPoint(v)){
					body = shapes[i].m_body;
					break;
				}
			}
			return body;
		},

		// get body index
		getIndex : function(body){
			return body == this.centerPanel.getBody() ? -1 : this.panels.each(
				function(panel, index){
					if(body == panel.getBody())
						return index;
				});
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
			this.panels.each(function(panel){
				var v = new b2Vec2(Math.random() * 2, Math.random() * 2);
				panel.getBody().SetLinearVelocity(v);
				panel.getBody().WakeUp();
			});
			this.start();
		},
		getActivation : function(){
			return this.activation;
		},
		step : function(timeStep, iteration){
			var that = this;
			if(this.activation){
				this.panels.each(function(panel, idx){
					var body = panel.getBody();
					// center panel has a gravity
					var direction = b2Math.SubtractVV(that.centerPanel.getPosition(),
						body.GetCenterPosition());

					var scala = b2Math.MulFV(body.m_mass * 0.01 *
						that.getAltitute(panel.getPosition()), direction);
					
					// trim force amount
					scala = scala > 3 ? 3 : scala;

					// apply force to panel
					body.ApplyForce(scala, that.centerPanel.getPosition());

					panel.update();
				});

				// center panel's movement logic..
				var cb = this.centerPanel.getBody();
				var cd = b2Math.SubtractVV(this.centroid, cb.GetCenterPosition());
				cb.ApplyForce(
					b2Math.MulFV(cb.m_mass *
						this.centerPanel.getDistance(this.centroid), cd),
					this.centroid);
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
			this.panels.push(panel);
			if(this.getAvgSpeed() < 1)
				this.wakeUp();
		},
		getPanel : function(index){
			return this.panels[index];
		},
		getPanelById : function(id){
			this.panels.each(function(panel){
				if(panel.getContent().getID() == id)
					return panel;
			});
		},
		rmPanel : function(panel){
			this.world.DestroyBody(panel.getBody());
			this.layer.remove(panel.getImage());
			this.layer.remove(panel.getText());
			this.panels.splice(this.getIndex(panel.getBody()),0);
		},
		getAvgSpeed : function(){
			var s = 0;
			this.panels.each(function(panel){
				var v = panel.getVelocity();
				s += Math.sqrt(b2Math.b2Dot(v, v));
			});
			return s / this.panels.length;
		},
		intersects : function(v){
			if(this.getBody(v) !== undefined){
				return true;
			}
		}
	};
})();

(function(){
	//Flanet Content
	Flanet.Content = function(json){
		this.setID(json.id);
		this.setName(json.name);
		this.setImgSrc(json.imgSrc);
		this.setClicked(json.clicked);
		this.setDragged(json.dragged);
		this.setDblclicked(json.dblclicked);
	};
	Flanet.Content.prototype = {
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
})();