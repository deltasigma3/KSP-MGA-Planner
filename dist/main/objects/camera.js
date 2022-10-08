export class CameraController extends THREE.OrbitControls {
    constructor(camera, canvas, system, config) {
        super(camera, canvas);
        this.camera = camera;
        this.canvas = canvas;
        this.system = system;
        this.config = config;
        this._lastTargetPos = new THREE.Vector3();
        this.camera.position.set(0, this.config.camera.startDist, 0);
        this.maxDistance = this.config.camera.maxDist;
        this.enableDamping = true;
        this.dampingFactor = this.config.camera.dampingFactor;
        this.rotateSpeed = this.config.camera.rotateSpeed;
        this.enablePan = false;
        canvas.addEventListener('dblclick', e => this.onDoubleClick(e));
        canvas.onselectstart = () => false;
        canvas.onmousedown = e => {
            if (e.button == 1) {
                e.preventDefault();
            }
        };
    }
    get targetBody() {
        return this._targetBody;
    }
    set targetBody(body) {
        const { scale } = this.config.rendering;
        const { minDistRadii } = this.config.camera;
        this.minDistance = body.radius * scale * minDistRadii;
        this._targetBody = body;
        this.centerOnTarget();
    }
    centerOnTarget() {
        const center = new THREE.Vector3();
        const objects = this.system.objectsOfBody(this._targetBody.id);
        objects.getWorldPosition(center);
        const rot = this.camera.rotation.clone();
        const disp = center.clone().sub(this._lastTargetPos);
        this.target.copy(center);
        this._lastTargetPos.copy(center);
        this.camera.rotation.copy(rot);
        this.camera.position.add(disp);
    }
    onDoubleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const w2 = this.canvas.clientWidth * 0.5;
        const h2 = this.canvas.clientHeight * 0.5;
        const mouse = new THREE.Vector2(event.clientX - rect.left - w2, event.clientY - rect.top - h2);
        mouse.y *= -1;
        let minDst = Infinity;
        let tgBody = this.system.sun;
        const { mouseFocusDst } = this.config.solarSystem;
        for (const body of this.system.bodies) {
            const objects = this.system.objectsOfBody(body.id);
            const screenPos = this.toScreenPosition(objects);
            const dst = screenPos.distanceTo(mouse);
            if (objects.visible && dst < mouseFocusDst) {
                if (dst < minDst) {
                    minDst = dst;
                    tgBody = body;
                }
            }
        }
        if (minDst >= 0)
            this.targetBody = tgBody;
    }
    toScreenPosition(obj) {
        const vec = new THREE.Vector3();
        const w2 = 0.5 * this.canvas.clientWidth;
        const h2 = 0.5 * this.canvas.clientHeight;
        this.camera.updateMatrixWorld();
        obj.updateMatrixWorld();
        vec.setFromMatrixPosition(obj.matrixWorld);
        vec.project(this.camera);
        vec.x = (vec.x * w2);
        vec.y = (vec.y * h2);
        return new THREE.Vector2(vec.x, vec.y);
    }
}
