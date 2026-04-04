declare namespace google.maps {
  export class Map {
    constructor(el: HTMLElement, options: any);
    fitBounds(bounds: any): void;
  }
  export class Polyline {
    constructor(options: any);
    setMap(map: Map | null): void;
    addListener(event: string, handler: () => void): void;
  }
  export class LatLngBounds {
    extend(latLng: any): void;
  }
  export namespace geometry.encoding {
    export function decodePath(polyline: string): any[];
  }
}
