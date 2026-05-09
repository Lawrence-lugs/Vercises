# yosys_gates

A minimal two-input AND gate synthesized with `yosys-then-ivlog`.

This fixture exists specifically to exercise the gate-level-netlist path in the
simulation pipeline and to verify that running the simulation twice in a row
succeeds (regression coverage for the write-permission bug on `netlist.v`).
