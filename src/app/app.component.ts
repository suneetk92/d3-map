import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import * as d3 from 'd3';
import { GeoProjection, Selection } from 'd3';
import { MapService } from './map.service';
import { Feature } from 'geojson';

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

  visReady: boolean;
  highlighted: string | undefined | null;
  clicked: string | undefined | null;

  constructor(private el: ElementRef, private mapService: MapService) {
    this.geoProjection = d3.geoOrthographic();
    this.visReady = false;
    this.height = 500;
    this.width = 500;
  }

  ngOnInit() {
    this.visReady = false;
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;

    this.mapChart = d3.select('#map');

    this.mapChart
      .append('circle')
      .attr('cx', this.width / 2)
      .attr('cy', this.height / 2)
      .attr('r', 249.5)
      .attr('fill', '#8ab4f8');

    const countriesGroup: Selection<SVGGElement, void, HTMLElement, any> =
      this.mapChart.append('g').attr('class', 'map');

    let xAngle = 285;

    let geoPath = d3.geoPath(
      this.geoProjection
        .translate([this.width / 2, this.height / 2])
        .rotate([xAngle, 0])
    );

    this.mapService.fetchCountryGeoJSON().subscribe((data) => {
      let interval: any;

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
              clearInterval(interval);
              globe.classed('clicked', (d) => d.id === data.id);
              text.text(data.id as string).attr('dx', '-35px');
            } else {
              this.clicked = null;
              interval = setInterval(() => {
                xAngle = (xAngle + 0.25) % 360;
                this.geoProjection.rotate([xAngle, 0]);
                globe.attr('d', geoPath);
              }, 100);
              globe.classed('clicked', false);
              text.text(null);
            }
          })
          .attr('d', geoPath);

      interval = setInterval(() => {
        xAngle = (xAngle + 0.25) % 360;
        this.geoProjection.rotate([xAngle, 0]);
        globe.attr('d', geoPath);
      }, 100);
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;
  }

  private static findColor(id: string): string {
    return d3.schemeCategory10[(id.charCodeAt(0) - 65) % 10];
  }
}
