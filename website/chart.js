var ctx = document.getElementById('myChart');
                var myChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['BURNED ON CREATION and PRESALE', 'DEV FUND', '2D GAME REWARDS', 'CIRCULATING SUPPLY'],
                        datasets: [{
                            label: '# of Votes',
                            data: [51, 10, 10, 29],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(153, 102, 255, 0.6)',
                                'rgba(255, 159, 64, 0.6)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 3
                        }]
                    },
                    options: {
                        layout: {
                          padding: 25
                        },
                        plugins: {
                          legend: {
                            maxWidth: 1000
                          }
                        }
                    }
                });


