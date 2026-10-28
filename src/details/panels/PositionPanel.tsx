import { Component } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';
import { type Satellite, type SubPoint, subPointAt, toSatellite } from '../../../shared/orbit.ts';

interface Props {
  noradId: number;
}

interface State {
  position: SubPoint | null;
}

export class PositionPanel extends Component<Props, State> {
  state: State = { position: null };
  private satellite: Satellite | null = null;
  private timer?: ReturnType<typeof setInterval>;

  componentDidMount() {
    this.load();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.noradId !== this.props.noradId) this.load();
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  load() {
    fetch(`/api/satellites/${this.props.noradId}`)
      .then((res) => res.json())
      .then((data: SatelliteDetails) => {
        this.satellite = toSatellite(data.omm);
        this.tick();
      });
  }

  tick() {
    if (!this.satellite) return;
    this.setState({ position: subPointAt(this.satellite, new Date()) });
  }

  render() {
    const p = this.state.position;
    if (!p) return <div className="panel-card">Lädt …</div>;
    return (
      <div className="panel-card">
        <h3>Position</h3>
        <dl>
          <dt>Breite</dt>
          <dd>{p.lat.toFixed(2)}°</dd>
          <dt>Länge</dt>
          <dd>{p.lon.toFixed(2)}°</dd>
          <dt>Höhe</dt>
          <dd>{Math.round(p.altKm)} km</dd>
        </dl>
      </div>
    );
  }
}
