import ora from 'ora';

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
      this.spinner.text = `Loading data into table ${table}`;
    }
  }
}

export default DBSpinner;
