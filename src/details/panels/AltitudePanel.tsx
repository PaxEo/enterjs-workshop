import { Component } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

interface Props {
  noradId: number;
}

interface State {
  perigee?: number;
  apogee?: number;
  loading: boolean;
}

export class AltitudePanel extends Component<Props, State> {
  state: State = { loading: true };

  componentDidMount() {
    fetch(`/api/satellites/${this.props.noradId}`)
      .then((res) => res.json())
      .then((data: SatelliteDetails) =>
        this.setState({ perigee: data.orbit.perigeeKm, apogee: data.orbit.apogeeKm, loading: false }),
      );
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.noradId !== this.props.noradId) {
      this.setState({ loading: true });
      fetch(`/api/satellites/${this.props.noradId}`)
        .then((res) => res.json())
        .then((data: SatelliteDetails) =>
          this.setState({ perigee: data.orbit.perigeeKm, apogee: data.orbit.apogeeKm, loading: false }),
        );
    }
  }

  render() {
    if (this.state.loading) return <div className="panel-card">Lädt …</div>;
    return (
      <div className="panel-card">
        <h3>Bahnhöhe</h3>
        <dl>
          <dt>Perigäum</dt>
          <dd>{Math.round(this.state.perigee!)} km</dd>
          <dt>Apogäum</dt>
          <dd>{Math.round(this.state.apogee!)} km</dd>
        </dl>
      </div>
    );
  }
}
