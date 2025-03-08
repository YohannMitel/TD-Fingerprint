export { MobilePhone }

class MobilePhone {
    constructor(mobileRSSI, k, fingerprintDB) {
        this.mobileRSSI = mobileRSSI;
        this.k = k;
        this.fingerprintDB = fingerprintDB;
    }

    // Compute the Euclidean distance between two RSSI values
    computeDistance(rssi1, rssi2) {
        return Math.abs(rssi1 - rssi2); // We just calculate the absolute difference for a single value
    }

    // Find K-nearest reference points based on RSSI similarity
    findKNearestNeighbors() {
        let distances = this.fingerprintDB.map(fp => ({
            x: fp.x,
            y: fp.y,
            z: fp.z,
            distance: this.computeDistance(fp.rssi, this.mobileRSSI)
        }));

        // Sort by distance (ascending) and take K-nearest neighbors
        return distances.sort((a, b) => a.distance - b.distance).slice(0, this.k);
    }

    // Compute weighted position using barycentric interpolation
    calculatePosition() {
        let neighbors = this.findKNearestNeighbors();

        // Compute inverse distance weights
        let weightSum = 0;
        let weights = neighbors.map(n => {
            let weight = 1 / (n.distance + 0.0001); // Avoid division by zero
            weightSum += weight;
            return { ...n, weight };
        });

        // Normalize weights
        weights = weights.map(n => ({
            ...n,
            weight: n.weight / weightSum
        }));

        // Compute final weighted position using barycentric interpolation
        let xM = weights.reduce((sum, n) => sum + n.x * n.weight, 0);
        let yM = weights.reduce((sum, n) => sum + n.y * n.weight, 0);
        let zM = weights.reduce((sum, n) => sum + n.z * n.weight, 0);

        return { x: xM, y: yM, z: zM };
    }
}