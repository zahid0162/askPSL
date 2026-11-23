export interface SampleMatchFixture {
  fileName: string;
  content: Record<string, unknown>;
}

export const SAMPLE_PSL_MATCHES: SampleMatchFixture[] = [
  {
    fileName: '1416472_lahore_vs_islamabad.json',
    content: {
      meta: { data_version: '1.1.0', created: '2024-02-17', revision: 1 },
      info: {
        balls_per_over: 6,
        city: 'Lahore',
        dates: ['2024-02-17'],
        event: { name: 'Pakistan Super League', match_number: 1, stage: 'Group' },
        gender: 'male',
        match_type: 'T20',
        outcome: { winner: 'Islamabad United', by: { wickets: 8 } },
        overs: 20,
        player_of_match: ['Shadab Khan'],
        season: '2024',
        teams: ['Lahore Qalandars', 'Islamabad United'],
        toss: { decision: 'field', winner: 'Islamabad United' },
        venue: 'Gaddafi Stadium, Lahore',
      },
      innings: [
        {
          team: 'Lahore Qalandars',
          overs: [
            {
              over: 0,
              deliveries: [
                {
                  batter: 'Fakhar Zaman',
                  bowler: 'Naseem Shah',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 0, extras: 0, total: 0 },
                },
                {
                  batter: 'Fakhar Zaman',
                  bowler: 'Naseem Shah',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Fakhar Zaman',
                  bowler: 'Naseem Shah',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Sahibzada Farhan',
                  bowler: 'Naseem Shah',
                  non_striker: 'Fakhar Zaman',
                  runs: { batter: 0, extras: 1, total: 1 },
                  extras: { wides: 1 },
                },
                {
                  batter: 'Sahibzada Farhan',
                  bowler: 'Naseem Shah',
                  non_striker: 'Fakhar Zaman',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Sahibzada Farhan',
                  bowler: 'Naseem Shah',
                  non_striker: 'Fakhar Zaman',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Fakhar Zaman',
                  bowler: 'Naseem Shah',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 0, extras: 0, total: 0 },
                  wickets: [
                    {
                      player_out: 'Fakhar Zaman',
                      kind: 'caught',
                      fielders: [{ name: 'Alex Hales' }],
                    },
                  ],
                },
              ],
            },
            {
              over: 1,
              deliveries: [
                {
                  batter: 'Sahibzada Farhan',
                  bowler: 'Imad Wasim',
                  non_striker: 'Rassie van der Dussen',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Rassie van der Dussen',
                  bowler: 'Imad Wasim',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Rassie van der Dussen',
                  bowler: 'Imad Wasim',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 2, extras: 0, total: 2 },
                },
                {
                  batter: 'Rassie van der Dussen',
                  bowler: 'Imad Wasim',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 0, extras: 0, total: 0 },
                },
                {
                  batter: 'Rassie van der Dussen',
                  bowler: 'Imad Wasim',
                  non_striker: 'Sahibzada Farhan',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Sahibzada Farhan',
                  bowler: 'Imad Wasim',
                  non_striker: 'Rassie van der Dussen',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
              ],
            },
            {
              over: 15,
              deliveries: [
                {
                  batter: 'Rassie van der Dussen',
                  bowler: 'Shadab Khan',
                  non_striker: 'Abdullah Shafique',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Rassie van der Dussen',
                  bowler: 'Shadab Khan',
                  non_striker: 'Abdullah Shafique',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Abdullah Shafique',
                  bowler: 'Shadab Khan',
                  non_striker: 'Rassie van der Dussen',
                  runs: { batter: 0, extras: 0, total: 0 },
                  wickets: [{ player_out: 'Abdullah Shafique', kind: 'bowled' }],
                },
              ],
            },
          ],
        },
        {
          team: 'Islamabad United',
          target: { runs: 33, overs: 20 },
          overs: [
            {
              over: 0,
              deliveries: [
                {
                  batter: 'Colin Munro',
                  bowler: 'Shaheen Shah Afridi',
                  non_striker: 'Alex Hales',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Colin Munro',
                  bowler: 'Shaheen Shah Afridi',
                  non_striker: 'Alex Hales',
                  runs: { batter: 0, extras: 0, total: 0 },
                  wickets: [{ player_out: 'Colin Munro', kind: 'lbw' }],
                },
                {
                  batter: 'Agha Salman',
                  bowler: 'Shaheen Shah Afridi',
                  non_striker: 'Alex Hales',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Alex Hales',
                  bowler: 'Shaheen Shah Afridi',
                  non_striker: 'Agha Salman',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Alex Hales',
                  bowler: 'Shaheen Shah Afridi',
                  non_striker: 'Agha Salman',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Alex Hales',
                  bowler: 'Shaheen Shah Afridi',
                  non_striker: 'Agha Salman',
                  runs: { batter: 2, extras: 0, total: 2 },
                },
              ],
            },
            {
              over: 1,
              deliveries: [
                {
                  batter: 'Agha Salman',
                  bowler: 'Haris Rauf',
                  non_striker: 'Alex Hales',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Agha Salman',
                  bowler: 'Haris Rauf',
                  non_striker: 'Alex Hales',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Agha Salman',
                  bowler: 'Haris Rauf',
                  non_striker: 'Alex Hales',
                  runs: { batter: 0, extras: 1, total: 1 },
                  extras: { legbyes: 1 },
                },
                {
                  batter: 'Alex Hales',
                  bowler: 'Haris Rauf',
                  non_striker: 'Agha Salman',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Alex Hales',
                  bowler: 'Haris Rauf',
                  non_striker: 'Agha Salman',
                  runs: { batter: 2, extras: 0, total: 2 },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    fileName: '1416485_multan_vs_karachi.json',
    content: {
      meta: { data_version: '1.1.0', created: '2024-02-28', revision: 1 },
      info: {
        balls_per_over: 6,
        city: 'Multan',
        dates: ['2024-02-28'],
        event: { name: 'Pakistan Super League', match_number: 14, stage: 'Group' },
        gender: 'male',
        match_type: 'T20',
        outcome: { winner: 'Multan Sultans', by: { runs: 20 } },
        overs: 20,
        player_of_match: ['Mohammad Rizwan'],
        season: '2024',
        teams: ['Multan Sultans', 'Karachi Kings'],
        toss: { decision: 'bat', winner: 'Multan Sultans' },
        venue: 'Multan Cricket Stadium',
      },
      innings: [
        {
          team: 'Multan Sultans',
          overs: [
            {
              over: 0,
              deliveries: [
                {
                  batter: 'Mohammad Rizwan',
                  bowler: 'Mir Hamza',
                  non_striker: 'Reeza Hendricks',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Reeza Hendricks',
                  bowler: 'Mir Hamza',
                  non_striker: 'Mohammad Rizwan',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Reeza Hendricks',
                  bowler: 'Mir Hamza',
                  non_striker: 'Mohammad Rizwan',
                  runs: { batter: 0, extras: 0, total: 0 },
                },
                {
                  batter: 'Reeza Hendricks',
                  bowler: 'Mir Hamza',
                  non_striker: 'Mohammad Rizwan',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Reeza Hendricks',
                  bowler: 'Mir Hamza',
                  non_striker: 'Mohammad Rizwan',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Mohammad Rizwan',
                  bowler: 'Mir Hamza',
                  non_striker: 'Reeza Hendricks',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
              ],
            },
            {
              over: 17,
              deliveries: [
                {
                  batter: 'Usman Khan',
                  bowler: 'Hasan Ali',
                  non_striker: 'Iftikhar Ahmed',
                  runs: { batter: 6, extras: 1, total: 7 },
                  extras: { noballs: 1 },
                },
                {
                  batter: 'Usman Khan',
                  bowler: 'Hasan Ali',
                  non_striker: 'Iftikhar Ahmed',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Usman Khan',
                  bowler: 'Hasan Ali',
                  non_striker: 'Iftikhar Ahmed',
                  runs: { batter: 2, extras: 0, total: 2 },
                },
                {
                  batter: 'Usman Khan',
                  bowler: 'Hasan Ali',
                  non_striker: 'Iftikhar Ahmed',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
              ],
            },
          ],
        },
        {
          team: 'Karachi Kings',
          target: { runs: 36, overs: 20 },
          overs: [
            {
              over: 0,
              deliveries: [
                {
                  batter: 'Shan Masood',
                  bowler: 'David Willey',
                  non_striker: 'Tim Seifert',
                  runs: { batter: 0, extras: 0, total: 0 },
                },
                {
                  batter: 'Shan Masood',
                  bowler: 'David Willey',
                  non_striker: 'Tim Seifert',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Shan Masood',
                  bowler: 'David Willey',
                  non_striker: 'Tim Seifert',
                  runs: { batter: 0, extras: 0, total: 0 },
                  wickets: [
                    {
                      player_out: 'Shan Masood',
                      kind: 'caught',
                      fielders: [{ name: 'Mohammad Rizwan' }],
                    },
                  ],
                },
                {
                  batter: 'James Vince',
                  bowler: 'David Willey',
                  non_striker: 'Tim Seifert',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Tim Seifert',
                  bowler: 'David Willey',
                  non_striker: 'James Vince',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Tim Seifert',
                  bowler: 'David Willey',
                  non_striker: 'James Vince',
                  runs: { batter: 4, extras: 0, total: 4 },
                  wickets: [
                    {
                      player_out: 'James Vince',
                      kind: 'run out',
                      fielders: [{ name: 'Usama Mir' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    fileName: '1354958_peshawar_vs_quetta.json',
    content: {
      meta: { data_version: '1.1.0', created: '2023-03-08', revision: 1 },
      info: {
        balls_per_over: 6,
        city: 'Rawalpindi',
        dates: ['2023-03-08'],
        event: { name: 'Pakistan Super League', match_number: 25, stage: 'Group' },
        gender: 'male',
        match_type: 'T20',
        outcome: { winner: 'Quetta Gladiators', by: { wickets: 8 } },
        overs: 20,
        player_of_match: ['Jason Roy'],
        season: '2023',
        teams: ['Peshawar Zalmi', 'Quetta Gladiators'],
        toss: { decision: 'bat', winner: 'Peshawar Zalmi' },
        venue: 'Rawalpindi Cricket Stadium',
      },
      innings: [
        {
          team: 'Peshawar Zalmi',
          overs: [
            {
              over: 0,
              deliveries: [
                {
                  batter: 'Babar Azam',
                  bowler: 'Naseem Shah',
                  non_striker: 'Saim Ayub',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Babar Azam',
                  bowler: 'Naseem Shah',
                  non_striker: 'Saim Ayub',
                  runs: { batter: 1, extras: 0, total: 1 },
                },
                {
                  batter: 'Saim Ayub',
                  bowler: 'Naseem Shah',
                  non_striker: 'Babar Azam',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Saim Ayub',
                  bowler: 'Naseem Shah',
                  non_striker: 'Babar Azam',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Saim Ayub',
                  bowler: 'Naseem Shah',
                  non_striker: 'Babar Azam',
                  runs: { batter: 0, extras: 0, total: 0 },
                },
                {
                  batter: 'Saim Ayub',
                  bowler: 'Naseem Shah',
                  non_striker: 'Babar Azam',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
              ],
            },
          ],
        },
        {
          team: 'Quetta Gladiators',
          target: { runs: 20, overs: 20 },
          overs: [
            {
              over: 0,
              deliveries: [
                {
                  batter: 'Jason Roy',
                  bowler: 'Wahab Riaz',
                  non_striker: 'Martin Guptill',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
                {
                  batter: 'Jason Roy',
                  bowler: 'Wahab Riaz',
                  non_striker: 'Martin Guptill',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Jason Roy',
                  bowler: 'Wahab Riaz',
                  non_striker: 'Martin Guptill',
                  runs: { batter: 4, extras: 0, total: 4 },
                },
                {
                  batter: 'Jason Roy',
                  bowler: 'Wahab Riaz',
                  non_striker: 'Martin Guptill',
                  runs: { batter: 6, extras: 0, total: 6 },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
