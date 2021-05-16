import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { GeoProjection, Selection } from 'd3';
import { MapService } from './map.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  mapChart: Selection<SVGPathElement, unknown, HTMLElement, any> | undefined;

  geoProjection: GeoProjection;

  height: number;
  width: number;

  visReady: boolean;

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

    d3.geoCircle();

    const countriesGroup = this.mapChart.append('g');
    let geoPath = d3.geoPath(
      this.geoProjection.translate([this.width / 2, this.height / 2])
    );

    this.mapService.fetchCountryGeoJSON().subscribe((data) => {
      let x = 0;

      let globe = countriesGroup
        .selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
        .attr('fill', (d) => AppComponent.findColor(d.id as string))
        .attr('data', (d) => d.id as string)
        .on('mouseover', (d, data) => {
          console.log(data.id);
        })
        .attr('d', geoPath);

      setInterval(() => {
        x = (x + 0.25) % 360;
        this.geoProjection.rotate([x, 0]);
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
