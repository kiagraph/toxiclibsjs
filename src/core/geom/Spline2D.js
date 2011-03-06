//rawPoints should be Vec2D array
function Spline2D(rawPoints,bernsteinPoly){
	if(arguments.length == 0){
		this.setTightness(Spline2D.DEFAULT_TIGHTNESS);
		this.pointList = [];
	}
	else if(arguments.length >= 3){
		this.pointList = rawPoints.slice(0); //copy array
		this.bernstein = bernsteinPoly;
		this.setTightness(tightness);
	}
	else if(arguments.length == 1){
	
		this.pointList = rawPoints;
        this.numP = rawPoints.length;
        this.coeffA = [];
        this.delta = [];
        this.bi = [];
        for (var i = 0; i < this.numP; i++) {
            this.coeffA[i] = new Vec2D();
            this.delta[i] = new Vec2D();
            this.bi[i] = 0;
        }
		//this.pointList = rawPoints.slice(0);
		//this.setTightness(Spline2D.DEFAULT_TIGHTNESS);
	}
	this.numP = this.pointList.length;
	this.bi = [];
}


Spline2D.prototype = {
	add: function(p){
		this.pointList.push(p.copy());
		return this;
	},
	
	/*computeVertices: function(res){		
		this.updateCoefficients();
		if(res < 1){
			res = 1;
		}
		res++;
		if(this.bernstein === undefined || bernstein.resolution != res){
			this.bernstein = new BernsteinPolynomial(res);
		}
		this.vertices = [];

		this.findCPoints();
		var deltaP = new Vec2D();
		var deltaQ = new Vec2D();
		res--;
		for(var i=0;i<this.numP - 1;i++){
			var p = this.points[i];
			var q = this.points[i + 1];
			deltaP.set(this.delta[i]).addSelf(p);
			deltaQ.set(q.subSelf(this.delta[i+1]));
			for(var k=0;k<res;k++){
				var x = p.x * this.bernstein.b0[k] + deltaP.x * this.bernstein.b1[k] + deltaQ.x * this.bernstein.b2[k] + q.x * this.bernstein.b3[k];
				
				var y = p.y * this.bernstein.b0[k] + deltaP.y * this.bernstein.b1[k] + deltaQ.y * this.bernstein.b2[k] + q.y * this.bernstein.b3[k];
				
				this.vertices.push(new Vec2D(x,y));
			}	
		}
		this.vertices.push(this.points[this.points.length-1]);
		return this.vertices;
	},*/
	
	computeVertices: function(res){
		this.updateCoefficients();
        if (this.bernstein == undefined || this.bernstein.resolution != res) {
            this.bernstein = new BernsteinPolynomial(res);
        }
        var bst = this.bernstein;
        this.vertices = [];
        this.findCPoints();
        var deltaP = new Vec2D();
        var deltaQ = new Vec2D();
        for (var i = 0; i < this.numP - 1; i++) {
            var p = this.points[i];
            var q = this.points[i + 1];
            deltaP.set(this.delta[i]).addSelf(p);
            deltaQ.set(q).subSelf(this.delta[i + 1]);
            for (var k = 0; k < bst.resolution; k++) {
                var x = p.x * bst.b0[k] + deltaP.x * bst.b1[k] +
                deltaQ.x * bst.b2[k] +
                q.x * bst.b3[k];
                var y = p.y * bst.b0[k] + deltaP.y * bst.b1[k] +
                deltaQ.y * bst.b2[k] +
                q.y * bst.b3[k];
                this.vertices.push(new Vec2D(x, y));
            }
        }
        return this.vertices;
    },

	
	/*findCPoints: function(){
		this.bi[1] = -this.tightness;
		var sx = (this.points[2].x - this.points[0].x - this.delta[0].x) * this.tightness;
		var sy = (this.points[2].y - this.points[0].y - this.delta[0].y) * this.tightness;
		this.coeffA[1].set(sx,sy);
		for(var i=2 ;i<this.numP - 1; i++){
			this.bi[i] = -1 / (this.invTightness + this.bi[i-1]);
			this.coeffA[i].set(
				-(this.points[i+1].x - this.points[i-1].x - this.coeffA[i-1].x) * this.bi[i],
				-(this.points[i+1].y - this.points[i-1].y - this.coeffA[i-1].y) * this.bi[i]
			);
		}
		for(var i= this.numP-2; i>0;i--){
			var resultX = this.coeffA[i].x + this.delta[i+1].x * this.bi[i];
			var resultY = this.coeffA[i].y + this.delta[i+1].y * this.bi[i];
			this.delta[i].set(resultX,resultY);
		}		
	},*/
	
	findCPoints: function(){
        this.bi[1] = -.25;
        this.coeffA[1].set((this.points[2].x - this.points[0].x - this.delta[0].x) * this.tightness, (this.points[2].y - this.points[0].y - this.delta[0].y) * this.tightness);
        for (var i = 2; i < this.numP - 1; i++) {
            this.bi[i] = -1 / (this.invTightness + this.bi[i - 1]);
            this.coeffA[i].set(-(this.points[i + 1].x - this.points[i - 1].x - this.coeffA[i - 1].x) *
            this.bi[i], -(this.points[i + 1].y - this.points[i - 1].y - this.coeffA[i - 1].y) *
            this.bi[i]);
        }
        for (var i = this.numP - 2; i > 0; i--) {
            this.delta[i].set(this.coeffA[i].x + this.delta[i + 1].x * this.bi[i], this.coeffA[i].y +
            this.delta[i + 1].y * this.bi[i]);
        }
      },
	
	getDecimatedVertices: function(step,doAddFinalVertex){
		if(doAddFinalVertex === undefined)doAddFinalVertex = true;
		if(this.vertices === undefined || this.vertices.length < 2){
			this.computeVertices(Spline2D.DEFAULT_RES);
		}
		var arcLen = this.getEstimatedArcLength();
		var uniform = [];
		var delta = step / arcLen;
		var currIdx = 0;
		for(var t =0; t<1.0; t+= delta){
			var currT = t * arcLen;
			while(currT >= this.arcLenIndex[currIdx]){
				currIdx++;
			}
			var p = this.vertices[currIdx - 1];
			var q = this.vertices[currIdx];
			var frac = ((currT - this.arcLenIndex[currIdx - 1]) / (this.arcLenIndex[currIdx] - this.arcLenIndex[currIdx - 1]));
			
			var i = p.interpolateTo(q,frac);
			this.uniform.push(i);
		}
		if(doAddFinalVertex){
			uniform.push(this.vertices[this.vertices.length-1]);
		}
		return uniform;
	},
	
	
	getEstimatedArcLength: function(){
		if(this.arcLenIndex === undefined || (this.arcLenIndex !== undefined && this.arcLenIndex.length != this.vertices.length)){
			this.arcLenIndex = [];
		}
		var arcLen = 0;
		for(var i=1;i<this.arcLenIndex.length;i++){
			var p = this.vertices[i-1];
			var q = this.vertices[i];
			arcLen += p.distanceTo(q);
			this.arcLenIndex[i] = arcLen;
		}
		return arcLen;
	},
	
	
	getNumPoints: function(){
		return this.numP;
	},
	
	getPointList: function(){
		return this.pointList;
	},
	
	getTightness: function(){
		return this.tightness;
	},
	
	setPointList: function(plist){
		this.pointList =plist.slice(0);
		return this;
	},
	
	setTightness: function(tight){
		this.tightness = tight;
		this.invTightness = 1 / this.tightness;
		return this;
	},
	
	updateCoefficients: function(){
		this.numP = this.pointList.length;
		if(this.points === undefined || (this.points != undefined && this.points.length != this.numP)) {
			this.coeffA = [];
			this.delta = [];
			this.bi = [];
			for(var i=0;i<this.numP; i++){
				this.coeffA[i] = new Vec2D();
				this.delta[i] = new Vec2D();
			}
			this.setTightness(this.tightness);
		}
		this.points = this.pointList.slice(0);
	}

};

Spline2D.DEFAULT_TIGHTNESS = 0.25;
Spline2D.DEFAULT_RES = 16;