import { Component } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

interface Props {
  noradId: number;
}

interface State {
  data: SatelliteDetails | null;
  loading: boolean;
  error: string | null;
}

export class LaunchPanel extends Component<Props, State> {
  state: State = { data: null, loading: true, error: null };

  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.noradId !== this.props.noradId) this.load();
  }

  load() {
    this.setState({ loading: true, error: null });
    fetch(`/api/satellites/${this.props.noradId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => this.setState({ data, loading: false }))
      .catch((err) => this.setState({ error: err.message, loading: false }));
  }

  render() {
    const { data, loading, error } = this.state;
    if (loading) return <div className="panel-card">Lädt …</div>;
    if (error) return <div className="panel-card error">Fehler: {error}</div>;
    if (!data) return null;

    const year = data.orbit.launchYear;
    const yearsInOrbit = year ? new Date().getFullYear() - year : null;

    return (
      <div className="panel-card">
        <h3>Start</h3>
        <dl>
          <dt>Startjahr</dt>
          <dd>{year ?? 'unbekannt'}</dd>
          <dt>Im Orbit seit</dt>
          <dd>{yearsInOrbit !== null ? `${yearsInOrbit} Jahren` : '–'}</dd>
        </dl>
      </div>
    );
  }
}
