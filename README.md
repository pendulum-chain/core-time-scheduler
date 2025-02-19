# core-time-scheduler

This project contains a simple script that allows buying on-demand core time on the relay chain for Pendulum runtimes.

## How to use

### Buy on-demand core time

To buy on-demand core time, you need to run the following command:

```bash
yarn buy:on-demand <network> <max-amount>
```

Where `<network>` is the network (relay chain) you want to buy on-demand core time on and `<max-amount>` is the maximum
amount you are willing to pay for it. Note that `<max-amount>` is in units of the relay chain's native currency _not_
the raw representation of it.

- The default value for `<network>` is `paseo`.
- The default value for `<max-amount>` is 1 unit.

### Buy bulk core time (Coming soon)

To buy bulk core time, you need to run the following command:

```bash
yarn renew:bulk <network>
```

Where `<network>` is the network (relay chain) you want to renew the lease.

- The default value for `<network>` is `paseo`. You can also use `all` to try to renew the lease on all Pendulum
  networks. 
