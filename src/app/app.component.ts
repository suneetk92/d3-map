import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { geoOrthographic, GeoProjection, geoPath } from 'd3-geo';
import { Selection, select } from 'd3-selection';
import { MapService } from './map.service';
import { Feature } from 'geojson';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  mapChart!: Selection<SVGElement, void, HTMLElement, any>;
  geoProjection: GeoProjection;

  height: number;
  width: number;

  xAngle: number = 285;

  visReady: boolean;
  highlighted: string | undefined | null;
  clicked: string | undefined | null;
  interval!: any;
  subscribe: Subscription | undefined;

  constructor(private el: ElementRef, private mapService: MapService) {
    this.geoProjection = geoOrthographic();
    this.visReady = false;
    this.height = 500;
    this.width = 500;
  }

  ngOnInit() {
    this.visReady = false;
    this.initializeGlobe();
  }

  private initializeGlobe() {
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;

    this.mapChart = select('#map');

    this.mapChart
      .append('circle')
      .attr('cx', this.width / 2)
      .attr('cy', this.height / 2)
      .attr('r', 249.5)
      .attr('fill', '#8ab4f8');

    const countriesGroup: Selection<SVGGElement, void, HTMLElement, any> =
      this.mapChart.append('g').attr('class', 'map');

    let path = geoPath(
      this.geoProjection
        .translate([this.width / 2, this.height / 2])
        .rotate([this.xAngle, 0])
    );

    this.subscribe = this.mapService.fetchCountryGeoJSON().subscribe((data) => {
      const text: Selection<SVGTextElement, void, HTMLElement, any> =
        this.mapChart
          .append('text')
          .attr('x', this.width / 2)
          .attr('y', this.height - 40)
          .attr('class', 'text');

      let globe: Selection<SVGPathElement, Feature, SVGGElement, unknown> =
        countriesGroup
          .selectAll('path')
          .data(data.features)
          .enter()
          .append('path')
          .attr('class', 'country')
          .attr('data', (d) => d.id as string)
          .on('mouseover', (d, data) => {
            globe.classed('highlighted', (d) => (d as any).id === data.id);
          })
          .on('mouseout', () => {
            globe.classed('highlighted', false);
          })
          .on('click', (d, data) => {
            if (data.id !== this.clicked) {
              this.clicked = data.id as string;
              clearInterval(this.interval);
              globe.classed('clicked', (d) => d.id === data.id);
              text.text(data.id as string).attr('dx', '-35px');
            } else {
              this.clicked = null;
              this.interval = setInterval(() => {
                this.xAngle = (this.xAngle + 0.25) % 360;
                this.geoProjection.rotate([this.xAngle, 0]);
                globe.attr('d', path);
              }, 100);
              globe.classed('clicked', false);
              text.text(null);
            }
          })
          .attr('d', path);

      this.interval = setInterval(() => {
        this.xAngle = (this.xAngle + 0.25) % 360;
        this.geoProjection.rotate([this.xAngle, 0]);
        globe.attr('d', path);
      }, 100);
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.mapChart.selectAll('*').remove();
    clearInterval(this.interval);
    this.subscribe?.unsubscribe();
    this.initializeGlobe();
  }

  private static findColor(id: string): string {
    return schemeCategory10[(id.charCodeAt(0) - 65) % 10];
  }
}
