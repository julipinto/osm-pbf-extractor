import ora from 'ora';
import { paint } from './conscolor.js';

class DBSpinner {
  spinner = null;
  current_load = '';

  constructor() {
    this.spinner = ora({
      discardStdin: false,
      text: 'Starting database load',
      color: 'yellow',
    }).start();
  }

  load(table) {
    if (this.current_load != table) {
      this.current_load = table;
      this.spinner.text = `Loading data into database ${paint(
        `> Table: ${table}\n`,
        'yellow'
      )}`;
    }
  }
}

export default DBSpinner;
